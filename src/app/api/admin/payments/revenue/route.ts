import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';

    // Default: Monthly data
    let interval = '1 month';
    let dateFormat = 'YYYY-MM';

    // Change interval and format based on period
    switch (period) {
      case 'daily':
        interval = '1 day';
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'weekly':
        interval = '1 week';
        dateFormat = 'IYYY-IW'; // ISO week
        break;
      case 'yearly':
        interval = '1 year';
        dateFormat = 'YYYY';
        break;
    }

    // Build dynamic query safely
    const revenueQuery = `
      SELECT 
        TO_CHAR(created_at, '${dateFormat}') AS period,
        COUNT(*) AS transaction_count,
        COALESCE(SUM(amount), 0) AS revenue,
        COUNT(DISTINCT user_id) AS unique_customers
      FROM payments
      WHERE status = 'completed'
        AND created_at >= NOW() - INTERVAL '12 ${interval}'
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12;
    `;

    console.log('Running revenue query:', revenueQuery);

    const result = await query(revenueQuery);

    return NextResponse.json({
      success: true,
      data: result.rows.reverse(), // reverse for chronological order
    });

  } catch (error: any) {
    console.error('Revenue analytics error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
