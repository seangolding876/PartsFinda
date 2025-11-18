import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    // Get current active subscription
    const subscriptionResult = await query(
      `SELECT 
        ss.plan_name,
        ss.start_date,
        ss.end_date,
        ss.is_active,
        CASE 
          WHEN ss.end_date IS NULL THEN 'no_subscription'
          WHEN ss.end_date > NOW() THEN 'active'
          ELSE 'expired'
        END as subscription_status
       FROM supplier_subscription ss 
       WHERE ss.user_id = $1 
       ORDER BY ss.created_at DESC 
       LIMIT 1`,
      [userInfo.userId]
    );

    if (subscriptionResult.rows.length > 0) {
      const subscription = subscriptionResult.rows[0];
      
      return NextResponse.json({
        plan: {
          plan_name: subscription.plan_name,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          is_active: subscription.is_active,
          status: subscription.subscription_status
        }
      });
    } else {
      // No subscription found - return Basic plan
      return NextResponse.json({
        plan: {
          plan_name: 'Basic',
          start_date: null,
          end_date: null,
          is_active: true,
          status: 'active'
        }
      });
    }

  } catch (error: any) {
    console.error('Membership plan fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch membership plan' },
      { status: 500 }
    );
  }
}