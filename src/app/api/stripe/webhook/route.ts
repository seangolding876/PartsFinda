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
    console.log('🛢️ Executing query:', text.substring(0, 100));
    const result = await pool.query(text, params);
    console.log('✅ Query successful, rows:', result.rowCount);
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

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`🔔 Webhook Event: ${event.type}`);
    console.log('🎯 Event ID:', event.id);
    console.log('🌐 Live Mode:', event.livemode);

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
    
    // ✅ Log error to webhook_errors table
    try {
      await query(
        'INSERT INTO webhook_errors (event_type, error_message) VALUES ($1, $2)',
        ['webhook_failed', error.message]
      );
    } catch (logError) {
      console.error('❌ Failed to log error:', logError);
    }
    
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

// ✅ ONLY CHECKOUT SESSION HANDLER - FIXED TIMESTAMP
async function handleCheckoutSessionCompleted(session: any) {
  console.log('💰 CHECKOUT SESSION COMPLETED');
  console.log('📦 Session ID:', session.id);
  console.log('💳 Payment Status:', session.payment_status);
  console.log('📋 Full Metadata:', session.metadata);
  
  try {
    // ✅ STEP 0: Log webhook receipt
    await query(
      'INSERT INTO webhook_logs (event_type, session_id, status) VALUES ($1, $2, $3)',
      ['checkout.session.completed', session.id, 'received']
    );

    // ✅ Extract metadata safely
    const metadata = session.metadata || {};
    const plan_id = metadata.plan_id;
    const user_id = metadata.user_id;
    const plan_name = metadata.plan_name;

    console.log('📋 Extracted Metadata:', { plan_id, user_id, plan_name });

    // ✅ Check if metadata exists
    if (!plan_id || !user_id) {
      console.error('❌ MISSING METADATA - Cannot process subscription');
      
      await query(
        'INSERT INTO webhook_errors (event_type, session_id, error_message) VALUES ($1, $2, $3)',
        ['checkout.session.completed', session.id, 'Missing plan_id or user_id in metadata']
      );
      
      await query(
        'UPDATE webhook_logs SET status = $1 WHERE session_id = $2',
        ['metadata_missing', session.id]
      );
      return;
    }

    console.log(`🔄 Processing subscription - User: ${user_id}, Plan: ${plan_id}`);

    // ✅ Update webhook log to processing
    await query(
      'UPDATE webhook_logs SET user_id = $1, plan_id = $2, status = $3 WHERE session_id = $4',
      [user_id, plan_id, 'processing', session.id]
    );

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
      
      await query(
        'INSERT INTO webhook_errors (event_type, session_id, error_message) VALUES ($1, $2, $3)',
        ['checkout.session.completed', session.id, `Plan not found: ${plan_id}`]
      );
      
      await query(
        'UPDATE webhook_logs SET status = $1 WHERE session_id = $2',
        ['plan_not_found', session.id]
      );
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

    // ✅ STEP 4: Calculate dates - FIXED VERSION
    const startDate = new Date();
    let endDate = new Date();
    
    // ✅ FIX: Validate and calculate end date safely
    let validEndDate = endDate;
    
    if (session.subscription) {
      // Recurring subscription - get end date from Stripe
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // ✅ FIX: Check if current_period_end is valid
        if (subscription.current_period_end && !isNaN(subscription.current_period_end)) {
          validEndDate = new Date(subscription.current_period_end * 1000);
          console.log('📅 Subscription end date from Stripe:', validEndDate);
        } else {
          throw new Error('Invalid current_period_end from Stripe');
        }
      } catch (error) {
        console.error('❌ Error retrieving subscription:', error);
        // Fallback to plan duration - SAFE CALCULATION
        const durationDays = parseInt(plan.duration_days) || 30;
        validEndDate.setDate(validEndDate.getDate() + durationDays);
        console.log('📅 Using fallback plan duration days:', durationDays);
      }
    } else {
      // One-time payment - use plan duration - SAFE CALCULATION
      const durationDays = parseInt(plan.duration_days) || 30;
      validEndDate.setDate(validEndDate.getDate() + durationDays);
      console.log('📅 Using plan duration days:', durationDays);
    }

    // ✅ FIX: Final validation of dates
    if (isNaN(validEndDate.getTime())) {
      console.error('❌ Invalid end date calculated, using 30 days default');
      validEndDate = new Date();
      validEndDate.setDate(validEndDate.getDate() + 30);
    }

    console.log('✅ Final dates - Start:', startDate, 'End:', validEndDate);

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
        validEndDate,  // ✅ FIX: Use validated end date
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
        session.payment_intent || session.id,
        session.subscription || null,
        amountPaid,
        session.currency?.toUpperCase() || 'USD',
        'completed',
        'card',
        startDate,
        validEndDate  // ✅ FIX: Use validated end date
      ]
    );
    console.log('💰 Subscription payment recorded');

    // ✅ STEP 8: Create notification
    await query(
      `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
      [user_id, 'subscription_activated', `Your ${plan.plan_name} subscription has been activated!`, 'pending']
    );

    // ✅ STEP 9: Update webhook log to completed
    await query(
      'UPDATE webhook_logs SET status = $1 WHERE session_id = $2',
      ['completed', session.id]
    );

    console.log(`🎉 SUBSCRIPTION SUCCESS: User ${user_id}, Plan ${plan.plan_name}`);
    console.log('💰 Payment details:', {
      amount: amountPaid,
      currency: session.currency
    });

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in checkout handler:', error.message);
    console.error('🔍 Error stack:', error.stack);
    
    // ✅ Log error to webhook_errors table
    try {
      await query(
        'INSERT INTO webhook_errors (event_type, session_id, error_message) VALUES ($1, $2, $3)',
        ['checkout.session.completed', session.id, error.message]
      );
      
      await query(
        'UPDATE webhook_logs SET status = $1 WHERE session_id = $2',
        ['failed', session.id]
      );
    } catch (logError) {
      console.error('❌ Failed to log error:', logError);
    }
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