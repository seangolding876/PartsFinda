// app/api/admin/payments/subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const subscriptionsQuery = `
      SELECT 
        sp.plan_name,
        sp.price,
        COUNT(ss.id) as total_subscriptions,
        COUNT(CASE WHEN ss.is_active THEN 1 END) as active_subscriptions,
        COALESCE(SUM(p.amount), 0) as total_revenue
      FROM subscription_plans sp
      LEFT JOIN supplier_subscription ss ON sp.plan_name = ss.plan_name
      LEFT JOIN payments p ON ss.user_id = p.user_id AND p.status = 'completed'
      GROUP BY sp.plan_id, sp.plan_name, sp.price
      ORDER BY total_revenue DESC
    `;

    const result = await query(subscriptionsQuery);
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    console.error('Subscriptions error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}