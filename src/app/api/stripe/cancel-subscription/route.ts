import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

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
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    // Get user's active subscription
    const subscriptionResult = await query(
      `SELECT stripe_subscription_id FROM supplier_subscription 
       WHERE user_id = $1 AND is_active = true`,
      [userInfo.userId]
    );

    if (subscriptionResult.rows.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const stripeSubscriptionId = subscriptionResult.rows[0].stripe_subscription_id;

    if (!stripeSubscriptionId) {
      return NextResponse.json({ error: 'No Stripe subscription ID found' }, { status: 400 });
    }

    // Cancel subscription in Stripe (immediately)
    const canceledSubscription = await stripe.subscriptions.cancel(stripeSubscriptionId);

    // Update database
    await query(
      `UPDATE supplier_subscription SET is_active = false WHERE stripe_subscription_id = $1`,
      [stripeSubscriptionId]
    );

    await query(
      'UPDATE users SET membership_plan = $1 WHERE id = $2',
      ['free', userInfo.userId]
    );

    // Create notification
    await query(
      `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
      [userInfo.userId, 'subscription_canceled', 'Your subscription has been canceled', 'pending']
    );

    return NextResponse.json({ 
      success: true,
      message: 'Subscription canceled successfully',
      canceled_at: canceledSubscription.canceled_at
    });

  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription: ' + error.message },
      { status: 500 }
    );
  }
}