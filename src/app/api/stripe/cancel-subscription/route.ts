import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Database function with connection pooling
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function query(text: string, params?: any[]) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error: any) {
    console.error('Database error:', error.message);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Cancel subscription request received');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    console.log('👤 User cancelling subscription:', userInfo.userId);

    // Get user's active subscription with plan details
    const subscriptionResult = await query(
      `SELECT ss.stripe_subscription_id, ss.plan_name, ss.start_date, ss.end_date 
       FROM supplier_subscription ss
       WHERE ss.user_id = $1 AND ss.is_active = true
       ORDER BY ss.id DESC LIMIT 1`,
      [userInfo.userId]
    );

    if (subscriptionResult.rows.length === 0) {
      console.log('❌ No active subscription found for user:', userInfo.userId);
      return NextResponse.json({ 
        success: false,
        error: 'No active subscription found' 
      }, { status: 400 });
    }

    const subscription = subscriptionResult.rows[0];
    const stripeSubscriptionId = subscription.stripe_subscription_id;

    if (!stripeSubscriptionId) {
      console.log('❌ No Stripe subscription ID found');
      return NextResponse.json({ 
        success: false,
        error: 'No Stripe subscription ID found' 
      }, { status: 400 });
    }

    console.log('📦 Cancelling subscription:', stripeSubscriptionId);

    // Cancel subscription in Stripe (immediately)
    const canceledSubscription = await stripe.subscriptions.cancel(stripeSubscriptionId);

    // Update database - deactivate subscription
    await query(
      `UPDATE supplier_subscription SET is_active = false, end_date = NOW() 
       WHERE stripe_subscription_id = $1`,
      [stripeSubscriptionId]
    );

    // Update user membership to free
    await query(
      'UPDATE users SET membership_plan = $1 WHERE id = $2',
      ['basic', userInfo.userId]
    );

    // Create cancellation notification
    await query(
      `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
      [userInfo.userId, 'subscription_canceled', `Your ${subscription.plan_name} subscription has been canceled`, 'pending']
    );

    // Log cancellation
    await query(
      `INSERT INTO subscription_cancellations (user_id, plan_name, stripe_subscription_id, canceled_at) 
       VALUES ($1, $2, $3, $4)`,
      [userInfo.userId, subscription.plan_name, stripeSubscriptionId, new Date()]
    );

    console.log('✅ Subscription cancelled successfully for user:', userInfo.userId);

    return NextResponse.json({ 
      success: true,
      message: 'Subscription canceled successfully',
      plan_name: subscription.plan_name,
      canceled_at: new Date().toISOString(),
      refund_available: false // You can add refund logic if needed
    });

  } catch (error: any) {
    console.error('❌ Cancel subscription error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to cancel subscription: ' + error.message 
      },
      { status: 500 }
    );
  }
}

// GET method to check subscription status
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    // Get current subscription status
    const subscriptionResult = await query(
      `SELECT 
        plan_name,
        start_date,
        end_date,
        is_active,
        stripe_subscription_id,
        renewal_count
       FROM supplier_subscription 
       WHERE user_id = $1 
       ORDER BY id DESC LIMIT 1`,
      [userInfo.userId]
    );

    const currentSubscription = subscriptionResult.rows.length > 0 ? subscriptionResult.rows[0] : null;

    return NextResponse.json({
      success: true,
      has_active_subscription: currentSubscription?.is_active || false,
      subscription: currentSubscription
    });

  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription: ' + error.message },
      { status: 500 }
    );
  }
}