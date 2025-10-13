import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { query } from '@/lib/db';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    console.error('❌ No Stripe signature found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('✅ Webhook signature verified');
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`🔄 Processing webhook event: ${event.type}`);

  try {
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
        console.log(`⚡ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
  
  try {
    // Update payment status in database
    const result = await query(
      'UPDATE payments SET status = $1 WHERE stripe_payment_id = $2 RETURNING *',
      ['completed', paymentIntent.id]
    );

    if (result.rows.length > 0) {
      console.log(`✅ Payment record updated: ${paymentIntent.id}`);
      
      const payment = result.rows[0];
      
      // Automatically activate subscription if it's a subscription payment
      if (paymentIntent.metadata?.plan_id) {
        await activateSubscription(
          parseInt(paymentIntent.metadata.user_id),
          parseInt(paymentIntent.metadata.plan_id),
          paymentIntent.id
        );
      }
    } else {
      console.log(`⚠️ No payment record found for: ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error('❌ Error updating payment:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log(`❌ Payment failed: ${paymentIntent.id}`);
  
  try {
    await query(
      'UPDATE payments SET status = $1 WHERE stripe_payment_id = $2',
      ['failed', paymentIntent.id]
    );
    console.log(`✅ Payment status updated to failed: ${paymentIntent.id}`);
  } catch (error) {
    console.error('❌ Error updating failed payment:', error);
  }
}

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

async function activateSubscription(userId: number, planId: number, paymentIntentId: string) {
  try {
    console.log(`🔄 Activating subscription for user ${userId}, plan ${planId}`);
    
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

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Create new subscription
    const subscriptionResult = await query(
      `INSERT INTO supplier_subscription (
        user_id, plan_name, start_date, end_date, is_active, renewal_count
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [userId, plan.plan_name, startDate, endDate, true, 0]
    );

    // Update user membership
    await query(
      'UPDATE users SET membership_plan = $1 WHERE id = $2',
      [plan.plan_name, userId]
    );

    // Create notification
    await query(
      `INSERT INTO notification_queue (
        user_id, type, message, status
      ) VALUES ($1, $2, $3, $4)`,
      [userId, 'subscription_activated', `Your ${plan.plan_name} subscription has been activated!`, 'pending']
    );

    console.log(`✅ Subscription activated for user ${userId}: ${plan.plan_name}`);
    
  } catch (error) {
    console.error('❌ Error activating subscription:', error);
  }
}