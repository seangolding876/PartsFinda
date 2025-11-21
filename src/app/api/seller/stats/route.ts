import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const sellerId = parseInt(userInfo.userId, 10);

    const statsResult = await query(
      `SELECT 
        (SELECT COUNT(*) FROM parts WHERE seller_id = $1 AND status = 'active') as active_listings,
        (SELECT COUNT(*) FROM request_queue WHERE seller_id = $1 AND status = 'processed'  AND ("isReject" = false OR "isReject" IS NULL)) as pending_quotes,
        (SELECT COALESCE(SUM(amount), 0) FROM subscription_payments WHERE seller_id = $1 AND status = 'completed' AND created_at >= NOW() - INTERVAL '30 days') as monthly_revenue,
        (SELECT COUNT(*) FROM request_quotes WHERE seller_id = $1) as total_quotes,
        (SELECT COUNT(*) FROM request_quotes WHERE seller_id = $1 AND status = 'accepted') as accepted_quotes
      `,
      [sellerId]
    );

    const stats = statsResult.rows[0] || {};
    const totalQuotes = parseInt(stats.total_quotes) || 0;
    const acceptedQuotes = parseInt(stats.accepted_quotes) || 0;
    const acceptanceRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        activeListings: parseInt(stats.active_listings) || 0,
        pendingQuotes: parseInt(stats.pending_quotes) || 0,
        monthlyRevenue: parseFloat(stats.monthly_revenue) || 0,
        totalQuotes,
        acceptanceRate: Math.round(acceptanceRate),
      }
    });

  } catch (error: any) {
    console.error('Error fetching stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stats',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
