// app/api/admin/payments/revenue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';
    
    let interval = '1 month';
    let dateFormat = 'YYYY-MM';
    
    switch (period) {
      case 'daily':
        interval = '1 day';
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'weekly':
        interval = '1 week';
        dateFormat = 'YYYY-WW';
        break;
      case 'yearly':
        interval = '1 year';
        dateFormat = 'YYYY';
        break;
    }

    const revenueQuery = `
      SELECT 
        TO_CHAR(created_at, $1) as period,
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount), 0) as revenue,
        COUNT(DISTINCT user_id) as unique_customers
      FROM payments 
      WHERE status = 'completed' 
        AND created_at >= NOW() - INTERVAL '12 ${interval}'
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `;

    const result = await query(revenueQuery, [dateFormat]);
    
    return NextResponse.json({
      success: true,
      data: result.rows.reverse()
    });

  } catch (error: any) {
    console.error('Revenue analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}