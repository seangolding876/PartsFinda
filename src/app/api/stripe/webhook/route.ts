export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ✅ FIX 1: Pool top level par - Connection pooling
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// ✅ FIX 2: Simple query function without pool.end()
async function query(text: string, params?: any[]) {
  try {
    console.log('🛢️ Executing query:', text);
    const result = await pool.query(text, params);
    console.log('✅ Query successful, rows:', result.rowCount);
    return result;
  } catch (error: any) {
    console.error('❌ Database error:', error.message);
    throw error;
  }
  // ❌ NO pool.end() - Connection reuse
}

export async function POST(request: NextRequest) {
  let event;
  
  try {
    console.log('🎯 WEBHOOK STARTED - partsfinda.com');
    
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    // ✅ FIX 3: Better logging for debugging
    console.log('📦 Webhook body received');
    console.log('🔐 Signature:', signature ? 'Present' : 'Missing');

    if (!signature) {
      console.error('❌ No Stripe signature');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET missing');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // ✅ Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`🔔 Webhook Event: ${event.type}`);
    console.log('🎯 Event ID:', event.id);
    console.log('🌐 Live Mode:', event.livemode);

    // ✅ FIX 4: Test database immediately
    console.log('🛢️ Testing database connection...');
    const dbTest = await query('SELECT NOW() as time');
    console.log('✅ Database connected:', dbTest.rows[0].time);

    // ✅ Process specific events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      default:
        console.log(`⚡ Unhandled event: ${event.type}`);
    }

    console.log('✅ WEBHOOK COMPLETED SUCCESSFULLY');
    
    return NextResponse.json({ 
      success: true,
      received: true, 
      processed: event.type,
      domain: 'partsfinda.com',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ WEBHOOK FAILED:', error.message);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Webhook processing failed',
        details: error.message 
      },
      { status: 400 }
    );
  }
}

// ✅ FIX 5: Simplified checkout handler
async function handleCheckoutSessionCompleted(session: any) {
  console.log('💰 CHECKOUT SESSION COMPLETED HANDLER');
  console.log('📦 Session ID:', session.id);
  console.log('💳 Payment Status:', session.payment_status);
  
  try {
    // ✅ FIX 6: Better metadata extraction
    const metadata = session.metadata || {};
    const plan_id = metadata.plan_id;
    const user_id = metadata.user_id;
    const plan_name = metadata.plan_name;

    console.log('📋 Metadata received:', { plan_id, user_id, plan_name });

    // ✅ FIX 7: Check metadata properly
    if (!plan_id || !user_id) {
      console.error('❌ MISSING METADATA - Cannot process subscription');
      console.log('📦 Full metadata:', metadata);
      
      // Log the issue but don't stop execution
      await query(
        'INSERT INTO webhook_errors (event_type, session_id, error_message) VALUES ($1, $2, $3)',
        ['checkout.session.completed', session.id, 'Missing plan_id or user_id in metadata']
      );
      return;
    }

    console.log(`🔄 Processing subscription - User: ${user_id}, Plan: ${plan_id}`);

    // ✅ FIX 8: Simple immediate database update
    // First, log that we received the webhook
    await query(
      'INSERT INTO webhook_logs (event_type, session_id, user_id, plan_id, status) VALUES ($1, $2, $3, $4, $5)',
      ['checkout.session.completed', session.id, user_id, plan_id, 'received']
    );

    // ✅ Get plan details
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE plan_id = $1',
      [plan_id]
    );

    if (planResult.rows.length === 0) {
      console.error('❌ Plan not found in database');
      await query(
        'UPDATE webhook_logs SET status = $1 WHERE session_id = $2',
        ['plan_not_found', session.id]
      );
      return;
    }

    const plan = planResult.rows[0];
    console.log('🎯 Plan found:', plan.plan_name);

    // ✅ Deactivate existing subscriptions
    await query(
      'UPDATE supplier_subscription SET is_active = false WHERE user_id = $1',
      [user_id]
    );

    // ✅ Calculate dates - SIMPLE VERSION
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (plan.duration_days || 30));

    // ✅ Create new subscription
    await query(
      `INSERT INTO supplier_subscription (
        user_id, plan_name, start_date, end_date, is_active,
        stripe_subscription_id, stripe_session_id, price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        user_id, 
        plan.plan_name, 
        startDate, 
        endDate, 
        true,
        session.subscription || null,
        session.id,
        plan.price
      ]
    );

    // ✅ Update user membership
    await query(
      'UPDATE users SET membership_plan = $1 WHERE id = $2',
      [plan.plan_name, user_id]
    );

    // ✅ Update webhook log
    await query(
      'UPDATE webhook_logs SET status = $1 WHERE session_id = $2',
      ['completed', session.id]
    );

    console.log(`✅ SUBSCRIPTION ACTIVATED: User ${user_id}, Plan ${plan.plan_name}`);

  } catch (error: any) {
    console.error('❌ ERROR in checkout handler:', error.message);
    
    // Log the error
    await query(
      'INSERT INTO webhook_errors (event_type, session_id, error_message) VALUES ($1, $2, $3)',
      ['checkout.session.completed', session.id, error.message]
    );
  }
}

// Other handlers (simplified)
async function handleSubscriptionUpdated(subscription: any) {
  console.log('🔄 Subscription updated:', subscription.id);
  
  try {
    const endDate = new Date(subscription.current_period_end * 1000);
    await query(
      'UPDATE supplier_subscription SET end_date = $1 WHERE stripe_subscription_id = $2',
      [endDate, subscription.id]
    );
  } catch (error: any) {
    console.error('❌ Error updating subscription:', error.message);
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log('💰 Invoice paid:', invoice.id);
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
    message: 'Stripe webhook endpoint active',
    domain: 'partsfinda.com',
    timestamp: new Date().toISOString()
  });
}