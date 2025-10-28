import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';

    // Default values
    let intervalUnit = 'month';
    let dateFormat = 'YYYY-MM';

    switch (period) {
      case 'daily':
        intervalUnit = 'day';
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'weekly':
        intervalUnit = 'week';
        dateFormat = 'IYYY-IW';
        break;
      case 'yearly':
        intervalUnit = 'year';
        dateFormat = 'YYYY';
        break;
    }

    // ✅ Proper interval syntax
    const interval = `12 ${intervalUnit}s`;

    const revenueQuery = `
      SELECT 
        TO_CHAR(created_at, '${dateFormat}') AS period,
        COUNT(*) AS transaction_count,
        COALESCE(SUM(amount), 0) AS revenue,
        COUNT(DISTINCT user_id) AS unique_customers
      FROM payments
      WHERE status = 'completed'
        AND created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12;
    `;

    console.log('Running revenue query:', revenueQuery);

    const result = await query(revenueQuery);

    return NextResponse.json({
      success: true,
      data: result.rows.reverse(),
    });

  } catch (error: any) {
    console.error('Revenue analytics error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
