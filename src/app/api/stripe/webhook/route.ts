export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Database function
async function query(text: string, params?: any[]) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  const result = await pool.query(text, params);
  await pool.end();
  return result;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Production Webhook Received');
    
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('❌ No Stripe signature');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET missing in production');
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
      console.error(`❌ Webhook signature verification failed:`, err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`🔄 Production Event: ${event.type}`);

    // ✅ Process the event
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

      default:
        console.log(`⚡ Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true, processed: event.type });

  } catch (error: any) {
    console.error('❌ Production Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook failed: ' + error.message },
      { status: 400 }
    );
  }
}

// ✅ SUBSCRIPTION: Checkout Session Completed - PRODUCTION
async function handleCheckoutSessionCompleted(session: any) {
  console.log(`💰 PRODUCTION: Checkout session completed: ${session.id}`);
  
  try {
    const { plan_id, user_id, plan_name } = session.metadata;
    
    if (!plan_id || !user_id) {
      console.error('❌ Missing metadata in production session');
      return;
    }

    console.log(`🔄 PRODUCTION: Activating subscription - User: ${user_id}, Plan: ${plan_id}`);

    // Get plan details
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE plan_id = $1',
      [plan_id]
    );

    if (planResult.rows.length === 0) {
      console.error(`❌ Plan not found in production: ${plan_id}`);
      return;
    }

    const plan = planResult.rows[0];

    // Deactivate existing subscriptions
    await query(
      'UPDATE supplier_subscription SET is_active = false WHERE user_id = $1',
      [user_id]
    );

    // Calculate dates
    const startDate = new Date();
    let endDate = new Date();
    
    if (session.subscription) {
      // Recurring subscription - get from Stripe
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      endDate = new Date(subscription.current_period_end * 1000);
    } else {
      // One-time payment - use plan duration
      endDate.setDate(endDate.getDate() + plan.duration_days);
    }

    // Create new subscription
    await query(
      `INSERT INTO supplier_subscription (
        user_id, plan_name, start_date, end_date, is_active, renewal_count,
        stripe_subscription_id, stripe_session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
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

    // Update user membership
    await query(
      'UPDATE users SET membership_plan = $1 WHERE id = $2',
      [plan.plan_name, user_id]
    );

    // Create notification
    await query(
      `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
      [user_id, 'subscription_activated', `Your ${plan.plan_name} subscription activated!`, 'pending']
    );

    // Save payment record
    await query(
      `INSERT INTO payments (
        user_id, stripe_payment_id, amount, currency, status, description, subscription_plan_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user_id,
        session.id,
        session.amount_total ? session.amount_total / 100 : plan.price,
        session.currency?.toUpperCase() || 'JMD',
        'completed',
        `Subscription: ${plan.plan_name}`,
        plan_id
      ]
    );

    console.log(`✅ PRODUCTION SUCCESS: Subscription activated for user ${user_id}`);

  } catch (error) {
    console.error('❌ PRODUCTION ERROR handling checkout session:', error);
  }
}
// ✅ SUBSCRIPTION: Subscription Created
async function handleSubscriptionCreated(subscription: any) {
  console.log(`📝 Subscription created: ${subscription.id}`);
  // Additional logic if needed
}

// ✅ SUBSCRIPTION: Subscription Updated
async function handleSubscriptionUpdated(subscription: any) {
  console.log(`🔄 Subscription updated: ${subscription.id}`);
  
  try {
    // Update end date in database
    const endDate = new Date(subscription.current_period_end * 1000);
    
    await query(
      'UPDATE supplier_subscription SET end_date = $1 WHERE stripe_subscription_id = $2',
      [endDate, subscription.id]
    );

    console.log(`✅ Subscription updated: ${subscription.id}`);
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
  }
}

// ✅ SUBSCRIPTION: Subscription Deleted/Canceled
async function handleSubscriptionDeleted(subscription: any) {
  console.log(`🗑️ Subscription deleted: ${subscription.id}`);
  
  try {
    // Deactivate subscription
    await query(
      'UPDATE supplier_subscription SET is_active = false WHERE stripe_subscription_id = $1',
      [subscription.id]
    );

    // Reset user plan to free
    const subResult = await query(
      'SELECT user_id FROM supplier_subscription WHERE stripe_subscription_id = $1',
      [subscription.id]
    );

    if (subResult.rows.length > 0) {
      const userId = subResult.rows[0].user_id;
      await query(
        'UPDATE users SET membership_plan = $1 WHERE id = $2',
        ['free', userId]
      );

      // Create notification
      await query(
        `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
        [userId, 'subscription_canceled', 'Your subscription has been canceled', 'pending']
      );

      console.log(`✅ Subscription deactivated for user: ${userId}`);
    }
  } catch (error) {
    console.error('❌ Error handling subscription deletion:', error);
  }
}

// ✅ SUBSCRIPTION: Recurring Payment Succeeded
async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log(`💰 Recurring payment succeeded: ${invoice.id}`);
  
  try {
    if (invoice.subscription) {
      // Extend subscription end date
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const newEndDate = new Date(subscription.current_period_end * 1000);
      
      await query(
        `UPDATE supplier_subscription 
         SET end_date = $1, renewal_count = renewal_count + 1 
         WHERE stripe_subscription_id = $2`,
        [newEndDate, invoice.subscription]
      );

      // Create renewal notification
      const subResult = await query(
        'SELECT user_id, plan_name FROM supplier_subscription WHERE stripe_subscription_id = $1',
        [invoice.subscription]
      );

      if (subResult.rows.length > 0) {
        const { user_id, plan_name } = subResult.rows[0];
        
        await query(
          `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
          [user_id, 'subscription_renewed', `Your ${plan_name} subscription has been renewed`, 'pending']
        );
      }

      console.log(`✅ Subscription renewed: ${invoice.subscription}`);
    }
  } catch (error) {
    console.error('❌ Error handling invoice payment:', error);
  }
}

// ✅ SUBSCRIPTION: Recurring Payment Failed
async function handleInvoicePaymentFailed(invoice: any) {
  console.log(`❌ Recurring payment failed: ${invoice.id}`);
  
  try {
    // Send notification to user
    if (invoice.subscription) {
      const subResult = await query(
        'SELECT user_id, plan_name FROM supplier_subscription WHERE stripe_subscription_id = $1',
        [invoice.subscription]
      );

      if (subResult.rows.length > 0) {
        const { user_id, plan_name } = subResult.rows[0];
        
        await query(
          `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
          [user_id, 'payment_failed', `Payment failed for your ${plan_name} subscription`, 'pending']
        );
      }
    }
  } catch (error) {
    console.error('❌ Error handling failed invoice:', error);
  }
}

// ✅ ONE-TIME PAYMENT: Success (Backup)
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log(`💰 One-time payment succeeded: ${paymentIntent.id}`);
  
  try {
    // Update payment status
    const result = await query(
      'UPDATE payments SET status = $1 WHERE stripe_payment_id = $2 RETURNING *',
      ['completed', paymentIntent.id]
    );

    if (result.rows.length > 0) {
      console.log(`✅ Payment updated: ${paymentIntent.id}`);
      
      // Activate subscription if plan exists
      if (paymentIntent.metadata?.plan_id && paymentIntent.metadata?.user_id) {
        await activateSubscription(
          parseInt(paymentIntent.metadata.user_id),
          parseInt(paymentIntent.metadata.plan_id),
          paymentIntent.id
        );
      }
    }
  } catch (error) {
    console.error('❌ Error updating payment:', error);
  }
}

// ✅ ONE-TIME PAYMENT: Failed (Backup)
async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log(`❌ One-time payment failed: ${paymentIntent.id}`);
  
  try {
    await query(
      'UPDATE payments SET status = $1 WHERE stripe_payment_id = $2',
      ['failed', paymentIntent.id]
    );
  } catch (error) {
    console.error('❌ Error updating failed payment:', error);
  }
}

// ✅ Activate Subscription (Helper function)
async function activateSubscription(userId: number, planId: number, paymentIntentId: string) {
  try {
    console.log(`🔄 Activating subscription - User: ${userId}, Plan: ${planId}`);
    
    // Get plan details
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE plan_id = $1',
      [planId]
    );

    if (planResult.rows.length === 0) {
      console.error(`❌ Plan not found: ${planId}`);
      return;
    }

    const plan = planResult.rows[0];

    // Deactivate existing subscriptions
    await query(
      'UPDATE supplier_subscription SET is_active = false WHERE user_id = $1',
      [userId]
    );

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Create new subscription
    await query(
      `INSERT INTO supplier_subscription (
        user_id, plan_name, start_date, end_date, is_active, renewal_count
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, plan.plan_name, startDate, endDate, true, 0]
    );

    // Update user membership
    await query(
      'UPDATE users SET membership_plan = $1 WHERE id = $2',
      [plan.plan_name, userId]
    );

    // Create notification
    await query(
      `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
      [userId, 'subscription_activated', `Your ${plan.plan_name} subscription activated!`, 'pending']
    );

    console.log(`✅ Subscription activated: ${plan.plan_name} for user ${userId}`);
    
  } catch (error) {
    console.error('❌ Error activating subscription:', error);
  }
}

// GET method for testing
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Stripe webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}