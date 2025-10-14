import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    const body = await request.json();
    const { paymentIntentId, planId } = body;

    if (!paymentIntentId || !planId) {
      return NextResponse.json(
        { success: false, error: 'Payment intent ID and plan ID are required' },
        { status: 400 }
      );
    }

    console.log('Verifying payment for intent:', paymentIntentId);

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log('Stripe PaymentIntent:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      currency: paymentIntent.currency,
    });

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { success: false, error: `Payment not completed (status: ${paymentIntent.status})` },
        { status: 400 }
      );
    }

    // Fetch plan details
    const planResult = await query('SELECT * FROM subscription_plans WHERE plan_id = $1', [planId]);
    if (planResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid plan ID' }, { status: 400 });
    }

    const plan = planResult.rows[0];
    console.log('Activating plan:', plan.plan_name);

    // Update payment status
    await query('UPDATE payments SET status = $1 WHERE stripe_payment_id = $2', ['completed', paymentIntentId]);

    // Deactivate any active subscriptions for this user
    await query('UPDATE supplier_subscription SET is_active = false WHERE user_id = $1', [userInfo.userId]);

    // Subscription date calculations
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Create new subscription
    const subscriptionResult = await query(
      `INSERT INTO supplier_subscription (
        user_id, plan_name, start_date, end_date, is_active, renewal_count
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [userInfo.userId, plan.plan_name, startDate, endDate, true, 0]
    );

    // Update user's plan
    await query('UPDATE users SET membership_plan = $1 WHERE id = $2', [plan.plan_name, userInfo.userId]);

    // Create notification
    await query(
      `INSERT INTO notification_queue (user_id, type, message, status)
       VALUES ($1, $2, $3, $4)`,
      [
        userInfo.userId,
        'subscription_activated',
        `Your ${plan.plan_name} subscription has been activated successfully!`,
        'pending',
      ]
    );

    console.log('Subscription created:', subscriptionResult.rows[0]);

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully!',
      data: subscriptionResult.rows[0],
    });
  } catch (error: any) {
    console.error('🔥 Payment confirmation error:', error);

    // Enhanced diagnostic logging
    const isStripeError = error?.type?.startsWith('Stripe');
    const isDatabaseError = error?.message?.includes('syntax') || error?.message?.includes('constraint');

    if (isStripeError) {
      console.error('Stripe Error Details:', {
        type: error.type,
        code: error.code,
        message: error.message,
        raw: error.raw,
      });
    }

    if (isDatabaseError) {
      console.error('Database Error Details:', error.message);
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred during payment confirmation',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
