
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check subscription status
    const subscriptionResult = await query(
      `SELECT plan_name, end_date 
       FROM supplier_subscription 
       WHERE user_id = $1 AND end_date IS NOT NULL
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (subscriptionResult.rows.length > 0) {
      const subscription = subscriptionResult.rows[0];
      const endDate = new Date(subscription.end_date);
      const now = new Date();

      // Check if subscription has expired
      if (endDate < now) {
        return NextResponse.json({
          expired: true,
          planName: subscription.plan_name,
          endDate: subscription.end_date
        });
      }
    }

    return NextResponse.json({ expired: false });

  } catch (error) {
    console.error('Subscription status check error:', error);
    return NextResponse.json({ error: 'Failed to check subscription' }, { status: 500 });
  }
}