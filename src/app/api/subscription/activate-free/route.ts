import { NextRequest, NextResponse } from 'next/server';
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

    const { planId } = await request.json();

    // Get plan details
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE plan_id = $1',
      [planId]
    );

    if (planResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const plan = planResult.rows[0];

    // Deactivate existing subscriptions
    await query(
      'UPDATE supplier_subscription SET is_active = false WHERE user_id = $1',
      [userInfo.userId]
    );

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Create free subscription
    const subscriptionResult = await query(
      `INSERT INTO supplier_subscription (
        user_id, plan_name, start_date, end_date, is_active, renewal_count
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [userInfo.userId, plan.plan_name, startDate, endDate, true, 0]
    );

    // Update user
    await query(
      'UPDATE users SET membership_plan = $1 WHERE id = $2',
      [plan.plan_name, userInfo.userId]
    );

    return NextResponse.json({
      success: true,
      data: subscriptionResult.rows[0],
      message: 'Free plan activated successfully!'
    });

  } catch (error: any) {
    console.error('Free plan activation error:', error);
    return NextResponse.json(
      { error: 'Failed to activate free plan' },
      { status: 500 }
    );
  }
}