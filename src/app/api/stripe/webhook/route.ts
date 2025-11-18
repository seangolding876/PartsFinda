export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ✅ Connection Pool
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
});

// ✅ Simple query function
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
      return;
    }

    console.log(`🔄 Activating subscription - User: ${user_id}, Plan: ${plan_id}`);

    // ✅ STEP 1: Update stripe_sessions status to 'completed'
    const sessionUpdateResult = await query(
      'UPDATE stripe_sessions SET status = $1, amount_total = $2 WHERE session_id = $3 RETURNING id',
      ['completed', session.amount_total ? session.amount_total / 100 : 0, session.id]
    );
    
    if (sessionUpdateResult.rows.length > 0) {
      console.log('✅ Stripe session updated to completed:', sessionUpdateResult.rows[0].id);
    } else {
      console.log('⚠️ Stripe session not found for update:', session.id);
    }

    // ✅ STEP 2: Get plan details
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

    // ✅ STEP 3: Deactivate existing subscriptions
    const deactivateResult = await query(
      'UPDATE supplier_subscription SET is_active = false WHERE user_id = $1',
      [user_id]
    );
    console.log('📊 Deactivated subscriptions:', deactivateResult.rowCount);

    // ✅ STEP 4: Calculate dates
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

    // ✅ STEP 5: Create new subscription in supplier_subscription
    const subscriptionResult = await query(
      `INSERT INTO supplier_subscription (
        user_id, plan_name, start_date, end_date, is_active, renewal_count,
        stripe_subscription_id, stripe_session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        user_id, 
        plan.plan_name, 
        startDate, 
        endDate, 
        true, 
        0,
        session.subscription || null,
        session.id
      ]
    );
    console.log('✅ Subscription created with ID:', subscriptionResult.rows[0]?.id);

    // ✅ STEP 6: Update user membership_plan
    const userUpdateResult = await query(
      'UPDATE users SET membership_plan = $1 WHERE id = $2 RETURNING id',
      [plan.plan_name, user_id]
    );
    console.log('👤 User membership_plan updated:', userUpdateResult.rowCount);

    // ✅ STEP 7: Create record in subscription_payments table
    const amountPaid = session.amount_total ? session.amount_total / 100 : plan.price;
    
    await query(
      `INSERT INTO subscription_payments (
        user_id, subscription_plan_id, stripe_payment_intent_id, stripe_subscription_id,
        amount, currency, status, payment_method,
        billing_cycle_start, billing_cycle_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        user_id,
        plan_id,
        session.payment_intent || session.id, // Use payment_intent if available, else session.id
        session.subscription || null,
        amountPaid,
        session.currency?.toUpperCase() || 'USD',
        'completed',
        'card', // Default payment method
        startDate,
        endDate
      ]
    );
    console.log('💰 Subscription payment recorded');

    // ✅ STEP 8: Create notification
    await query(
      `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
      [user_id, 'subscription_activated', `Your ${plan.plan_name} subscription has been activated!`, 'pending']
    );

    console.log(`🎉 SUBSCRIPTION SUCCESS: User ${user_id}, Plan ${plan.plan_name}`);
    console.log('💰 Payment details:', {
      amount: amountPaid,
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