// app/api/stripe/webhook/route.ts - FINAL VERSION
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Database function
async function query(text: string, params?: any[]) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const result = await pool.query(text, params);
  await pool.end();
  return result;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook received');
    
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('❌ No Stripe signature');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`🔄 Processing: ${event.type}`);

    // Event handling
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;

      default:
        console.log(`⚡ Unhandled: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook failed: ' + error.message },
      { status: 400 }
    );
  }
}

// Payment Success Handler
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
  
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
    } else {
      console.log(`⚠️ No payment record: ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error('❌ Error updating payment:', error);
  }
}

// Payment Failed Handler
async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log(`❌ Payment failed: ${paymentIntent.id}`);
  
  try {
    await query(
      'UPDATE payments SET status = $1 WHERE stripe_payment_id = $2',
      ['failed', paymentIntent.id]
    );
    console.log(`✅ Status updated to failed: ${paymentIntent.id}`);
  } catch (error) {
    console.error('❌ Error updating failed payment:', error);
  }
}

// Payment Canceled Handler
async function handlePaymentIntentCanceled(paymentIntent: any) {
  console.log(`🚫 Payment canceled: ${paymentIntent.id}`);
  
  try {
    await query(
      'UPDATE payments SET status = $1 WHERE stripe_payment_id = $2',
      ['canceled', paymentIntent.id]
    );
  } catch (error) {
    console.error('❌ Error updating canceled payment:', error);
  }
}

// Activate Subscription
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