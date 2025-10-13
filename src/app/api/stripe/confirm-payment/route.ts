import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    const { paymentIntentId, planId } = await request.json();

    if (!paymentIntentId || !planId) {
      return NextResponse.json({ error: 'Payment intent ID and plan ID are required' }, { status: 400 });
    }

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Get plan details
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE plan_id = $1',
      [planId]
    );

    if (planResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const plan = planResult.rows[0];

    // Update payment status
    await query(
      'UPDATE payments SET status = $1 WHERE stripe_payment_id = $2',
      ['completed', paymentIntentId]
    );

    // Deactivate existing subscriptions
    await query(
      'UPDATE supplier_subscription SET is_active = false WHERE user_id = $1',
      [userInfo.userId]
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
      [
        userInfo.userId,
        plan.plan_name,
        startDate,
        endDate,
        true,
        0
      ]
    );

    // Update user membership plan
    await query(
      'UPDATE users SET membership_plan = $1 WHERE id = $2',
      [plan.plan_name, userInfo.userId]
    );

    // Create notification
    await query(
      `INSERT INTO notification_queue (
        user_id, type, message, status
      ) VALUES ($1, $2, $3, $4)`,
      [
        userInfo.userId,
        'subscription_activated',
        `Your ${plan.plan_name} subscription has been activated successfully!`,
        'pending'
      ]
    );

    const newSubscription = subscriptionResult.rows[0];

    return NextResponse.json({
      success: true,
      data: newSubscription,
      message: 'Subscription activated successfully!'
    });

  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}