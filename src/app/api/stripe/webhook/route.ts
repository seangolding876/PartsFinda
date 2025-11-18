export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ✅ FIX: Connection Pool - NO pool.end()
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
});

// ✅ Simple query function without pool.end()
async function query(text: string, params?: any[]) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error: any) {
    console.error('❌ Database error:', error.message);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 WEBHOOK STARTED - partsfinda.com');
    
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('❌ No Stripe signature');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET missing');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`🔔 Webhook Event: ${event.type}`);
    console.log('🎯 Event ID:', event.id);

    // ✅ Test database immediately
    try {
      const dbTest = await query('SELECT NOW() as time');
      console.log('✅ Database connected:', dbTest.rows[0].time);
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // ✅ ONLY PROCESS CHECKOUT SESSION
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutSessionCompleted(event.data.object);
    } else {
      console.log(`⚡ Other event (ignored): ${event.type}`);
    }

    return NextResponse.json({ 
      success: true,
      received: true, 
      processed: event.type,
      domain: 'partsfinda.com',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Webhook error:', error.message);
    return NextResponse.json(
      { 
        success: false,
        error: 'Webhook processing failed',
        message: error.message 
      },
      { status: 400 }
    );
  }
}

// ✅ ONLY CHECKOUT SESSION HANDLER
async function handleCheckoutSessionCompleted(session: any) {
  console.log('💰 CHECKOUT SESSION COMPLETED');
  console.log('📦 Session ID:', session.id);
  console.log('💳 Payment Status:', session.payment_status);
  console.log('📋 Full Metadata:', session.metadata);
  
  try {
    // ✅ Extract metadata safely
    const metadata = session.metadata || {};
    const plan_id = metadata.plan_id;
    const user_id = metadata.user_id;
    const plan_name = metadata.plan_name;

    console.log('📋 Extracted Metadata:', { plan_id, user_id, plan_name });

    // ✅ Check if metadata exists
    if (!plan_id || !user_id) {
      console.error('❌ MISSING METADATA - Cannot process subscription');
      console.log('❌ Plan ID:', plan_id);
      console.log('❌ User ID:', user_id);
      return;
    }

    console.log(`🔄 Activating subscription - User: ${user_id}, Plan: ${plan_id}`);

    // ✅ Get plan details
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE plan_id = $1',
      [plan_id]
    );

    if (planResult.rows.length === 0) {
      console.error(`❌ Plan not found: ${plan_id}`);
      return;
    }

    const plan = planResult.rows[0];
    console.log('🎯 Plan found:', plan.plan_name, 'Price:', plan.price);

    // ✅ STEP 1: Deactivate existing subscriptions
    const deactivateResult = await query(
      'UPDATE supplier_subscription SET is_active = false WHERE user_id = $1',
      [user_id]
    );
    console.log('📊 Deactivated subscriptions:', deactivateResult.rowCount);

    // ✅ STEP 2: Calculate dates
    const startDate = new Date();
    let endDate = new Date();
    
    if (session.subscription) {
      // Recurring subscription - get end date from Stripe
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        endDate = new Date(subscription.current_period_end * 1000);
        console.log('📅 Subscription end date from Stripe:', endDate);
      } catch (error) {
        console.error('❌ Error retrieving subscription:', error);
        // Fallback to plan duration
        endDate.setDate(endDate.getDate() + (plan.duration_days || 30));
      }
    } else {
      // One-time payment - use plan duration
      endDate.setDate(endDate.getDate() + (plan.duration_days || 30));
      console.log('📅 Using plan duration days:', plan.duration_days);
    }

    // ✅ STEP 3: Create new subscription
    const subscriptionResult = await query(
      `INSERT INTO supplier_subscription (
        user_id, plan_name, start_date, end_date, is_active, renewal_count,
        stripe_subscription_id, stripe_session_id, price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        user_id, 
        plan.plan_name, 
        startDate, 
        endDate, 
        true, 
        0,
        session.subscription || null,
        session.id,
        plan.price
      ]
    );
    console.log('✅ Subscription created with ID:', subscriptionResult.rows[0]?.id);

    // ✅ STEP 4: Update user membership
    const userUpdateResult = await query(
      'UPDATE users SET membership_plan = $1 WHERE id = $2 RETURNING id',
      [plan.plan_name, user_id]
    );
    console.log('👤 User membership updated:', userUpdateResult.rowCount);

    // ✅ STEP 5: Create notification
    await query(
      `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
      [user_id, 'subscription_activated', `Your ${plan.plan_name} subscription has been activated!`, 'pending']
    );

    // ✅ STEP 6: Calculate payment details
    const amountPaid = session.amount_total ? session.amount_total / 100 : plan.price;
    const originalAmount = plan.price;
    const discountAmount = originalAmount - amountPaid;

    // ✅ STEP 7: Save payment record
    await query(
      `INSERT INTO payments (
        user_id, stripe_payment_id, amount, currency, status, description, 
        subscription_plan_id, discount_amount, original_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        user_id,
        session.id,
        amountPaid,
        session.currency?.toUpperCase() || 'JMD',
        'completed',
        `Subscription: ${plan.plan_name}${discountAmount > 0 ? ` (Discount: ${discountAmount})` : ''}`,
        plan_id,
        discountAmount,
        originalAmount
      ]
    );

    console.log(`🎉 SUBSCRIPTION SUCCESS: User ${user_id}, Plan ${plan.plan_name}`);
    console.log('💰 Payment details:', {
      original: originalAmount,
      paid: amountPaid,
      discount: discountAmount,
      currency: session.currency
    });

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in checkout handler:', error.message);
    console.error('🔍 Error stack:', error.stack);
  }
}

// ✅ GET method for testing
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const test = url.searchParams.get('test');
  
  if (test === 'db') {
    try {
      const result = await query('SELECT NOW() as time, version() as version');
      return NextResponse.json({
        success: true,
        database: 'connected',
        time: result.rows[0].time,
        version: result.rows[0].version
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Stripe webhook endpoint active - partsfinda.com',
    domain: 'partsfinda.com',
    timestamp: new Date().toISOString()
  });
}