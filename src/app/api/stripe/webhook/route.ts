export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ✅ Production Database Connection with Better Error Handling
async function query(text: string, params?: any[]) {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { 
      rejectUnauthorized: false 
    } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10
  });

  try {
    console.log('🛢️ Executing query:', text.substring(0, 100), '...');
    const result = await pool.query(text, params);
    console.log('✅ Query successful, rows affected:', result.rowCount);
    return result;
  } catch (error: any) {
    console.error('❌ Database query failed:', {
      query: text.substring(0, 100),
      params: params,
      error: error.message
    });
    throw error;
  } finally {
    await pool.end();
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 PRODUCTION Webhook Received - partsfinda.com');
    
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('❌ No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET missing in environment');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`🔄 PRODUCTION Event Received: ${event.type}`);
    console.log('📦 Event ID:', event.id);
    console.log('🌐 Live Mode:', event.livemode);

    // ✅ Process the event with better error handling
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object);
          break;

        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object);
          break;

        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object);
          break;

        default:
          console.log(`⚡ Unhandled event type: ${event.type}`);
      }
    } catch (processingError: any) {
      console.error('❌ Error processing event:', processingError);
      // Don't return error - just log it
    }

    return NextResponse.json({ 
      received: true, 
      processed: event.type,
      domain: 'partsfinda.com',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ PRODUCTION Webhook overall error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// ✅ SUBSCRIPTION: Checkout Session Completed - PRODUCTION (IMPROVED)
async function handleCheckoutSessionCompleted(session: any) {
  console.log('💰 PRODUCTION: Checkout session completed');
  console.log('📦 Session ID:', session.id);
  console.log('💳 Payment Status:', session.payment_status);
  console.log('📋 Metadata:', session.metadata);
  
  try {
    // ✅ Test database connection first
    console.log('🛢️ Testing database connection...');
    const dbTest = await query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Database connected:', dbTest.rows[0]);

    const { plan_id, user_id, plan_name } = session.metadata || {};
    
    if (!plan_id || !user_id) {
      console.error('❌ Missing required metadata:', { plan_id, user_id });
      return;
    }

    console.log(`🔄 Processing subscription - User: ${user_id}, Plan: ${plan_id}`);

    // ✅ Get plan details
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE plan_id = $1',
      [plan_id]
    );

    if (planResult.rows.length === 0) {
      console.error(`❌ Plan not found in database: ${plan_id}`);
      return;
    }

    const plan = planResult.rows[0];
    console.log('🎯 Plan found:', plan.plan_name, 'Price:', plan.price);

    // ✅ Deactivate existing subscriptions
    const deactivateResult = await query(
      'UPDATE supplier_subscription SET is_active = false WHERE user_id = $1 RETURNING id',
      [user_id]
    );
    console.log('📊 Deactivated existing subscriptions:', deactivateResult.rowCount);

    // ✅ Calculate dates
    const startDate = new Date();
    let endDate = new Date();
    
    if (session.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        endDate = new Date(subscription.current_period_end * 1000);
        console.log('📅 Subscription end date from Stripe:', endDate);
      } catch (stripeError) {
        console.error('❌ Error retrieving subscription from Stripe:', stripeError);
        // Fallback to plan duration
        endDate.setDate(endDate.getDate() + plan.duration_days);
      }
    } else {
      endDate.setDate(endDate.getDate() + plan.duration_days);
      console.log('📅 Using plan duration days:', plan.duration_days);
    }

    // ✅ Create new subscription
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

    // ✅ Update user membership
    const userUpdateResult = await query(
      'UPDATE users SET membership_plan = $1 WHERE id = $2 RETURNING id',
      [plan.plan_name, user_id]
    );
    console.log('👤 User membership updated:', userUpdateResult.rowCount);

    // ✅ Create notification
    await query(
      `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
      [user_id, 'subscription_activated', `Your ${plan.plan_name} subscription has been activated!`, 'pending']
    );

    // ✅ Calculate actual amount paid (considering discounts)
    const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
    const originalAmount = plan.price;
    const discountAmount = originalAmount - amountPaid;

    // ✅ Save payment record
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

    console.log(`🎉 PRODUCTION SUCCESS: Subscription fully activated for user ${user_id}`);
    console.log('💰 Payment details:', {
      original: originalAmount,
      paid: amountPaid,
      discount: discountAmount,
      currency: session.currency
    });

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in handleCheckoutSessionCompleted:', {
      error: error.message,
      stack: error.stack,
      sessionId: session.id,
      userId: session.metadata?.user_id
    });
  }
}

// ✅ SUBSCRIPTION: Subscription Created
async function handleSubscriptionCreated(subscription: any) {
  console.log(`📝 Subscription created: ${subscription.id}`);
  console.log('📊 Subscription status:', subscription.status);
  // Additional logic if needed
}

// ✅ SUBSCRIPTION: Subscription Updated
async function handleSubscriptionUpdated(subscription: any) {
  console.log(`🔄 Subscription updated: ${subscription.id}`);
  console.log('📊 New status:', subscription.status);
  
  try {
    const endDate = new Date(subscription.current_period_end * 1000);
    
    const result = await query(
      'UPDATE supplier_subscription SET end_date = $1, updated_at = NOW() WHERE stripe_subscription_id = $2 RETURNING id',
      [endDate, subscription.id]
    );

    if (result.rowCount > 0) {
      console.log(`✅ Subscription updated in database: ${subscription.id}`);
    } else {
      console.log(`⚠️ Subscription not found in database: ${subscription.id}`);
    }
  } catch (error: any) {
    console.error('❌ Error updating subscription:', error.message);
  }
}

// ✅ SUBSCRIPTION: Subscription Deleted/Canceled
async function handleSubscriptionDeleted(subscription: any) {
  console.log(`🗑️ Subscription deleted: ${subscription.id}`);
  
  try {
    const result = await query(
      'UPDATE supplier_subscription SET is_active = false, end_date = NOW() WHERE stripe_subscription_id = $1 RETURNING user_id',
      [subscription.id]
    );

    if (result.rows.length > 0) {
      const userId = result.rows[0].user_id;
      
      await query(
        'UPDATE users SET membership_plan = $1 WHERE id = $2',
        ['free', userId]
      );

      await query(
        `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
        [userId, 'subscription_canceled', 'Your subscription has been canceled', 'pending']
      );

      console.log(`✅ Subscription deactivated for user: ${userId}`);
    }
  } catch (error: any) {
    console.error('❌ Error handling subscription deletion:', error.message);
  }
}

// ✅ SUBSCRIPTION: Recurring Payment Succeeded
async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log(`💰 Recurring payment succeeded: ${invoice.id}`);
  console.log('💳 Amount:', invoice.amount_paid / 100);
  
  try {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const newEndDate = new Date(subscription.current_period_end * 1000);
      
      const result = await query(
        `UPDATE supplier_subscription 
         SET end_date = $1, renewal_count = renewal_count + 1, last_renewal = NOW() 
         WHERE stripe_subscription_id = $2 RETURNING user_id, plan_name`,
        [newEndDate, invoice.subscription]
      );

      if (result.rows.length > 0) {
        const { user_id, plan_name } = result.rows[0];
        
        await query(
          `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
          [user_id, 'subscription_renewed', `Your ${plan_name} subscription has been renewed`, 'pending']
        );

        console.log(`✅ Subscription renewed: ${invoice.subscription} for user ${user_id}`);
      }
    }
  } catch (error: any) {
    console.error('❌ Error handling invoice payment:', error.message);
  }
}

// ✅ SUBSCRIPTION: Recurring Payment Failed
async function handleInvoicePaymentFailed(invoice: any) {
  console.log(`❌ Recurring payment failed: ${invoice.id}`);
  
  try {
    if (invoice.subscription) {
      const result = await query(
        'SELECT user_id, plan_name FROM supplier_subscription WHERE stripe_subscription_id = $1',
        [invoice.subscription]
      );

      if (result.rows.length > 0) {
        const { user_id, plan_name } = result.rows[0];
        
        await query(
          `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
          [user_id, 'payment_failed', `Payment failed for your ${plan_name} subscription. Please update your payment method.`, 'pending']
        );

        console.log(`⚠️ Payment failed notification sent to user: ${user_id}`);
      }
    }
  } catch (error: any) {
    console.error('❌ Error handling failed invoice:', error.message);
  }
}

// ✅ ONE-TIME PAYMENT: Success (Backup)
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log(`💰 One-time payment succeeded: ${paymentIntent.id}`);
  
  try {
    const result = await query(
      'UPDATE payments SET status = $1, updated_at = NOW() WHERE stripe_payment_id = $2 RETURNING *',
      ['completed', paymentIntent.id]
    );

    if (result.rows.length > 0) {
      console.log(`✅ Payment updated: ${paymentIntent.id}`);
    }
  } catch (error: any) {
    console.error('❌ Error updating payment:', error.message);
  }
}

// ✅ ONE-TIME PAYMENT: Failed (Backup)
async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log(`❌ One-time payment failed: ${paymentIntent.id}`);
  
  try {
    await query(
      'UPDATE payments SET status = $1, updated_at = NOW() WHERE stripe_payment_id = $2',
      ['failed', paymentIntent.id]
    );
  } catch (error: any) {
    console.error('❌ Error updating failed payment:', error.message);
  }
}

// GET method for testing webhook endpoint
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
    message: 'Stripe webhook endpoint is active - partsfinda.com',
    domain: 'partsfinda.com',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}