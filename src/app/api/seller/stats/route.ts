import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// ✅ Simple dynamic export
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // For build time, return empty data
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        success: true,
        data: {
          activeListings: 0,
          pendingQuotes: 0,
          completedOrders: 0,
          monthlyRevenue: 0,
          totalQuotes: 0,
          acceptanceRate: 0,
          avgResponseTime: 0
        }
      });
    }

    // Authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const sellerId = parseInt(userInfo.userId, 10);

    // Get seller stats with simpler query
    const statsResult = await query(
      `SELECT 
        (SELECT COUNT(*) FROM parts WHERE seller_id = $1) as active_listings,
        (SELECT COUNT(*) FROM request_queue WHERE seller_id = $1 AND status = 'processed') as pending_quotes,
        (SELECT COALESCE(SUM(price), 0) FROM request_quotes WHERE seller_id = $1) as monthly_revenue
      `,
      [sellerId]
    );

    const stats = statsResult.rows[0] || {};

    return NextResponse.json({
      success: true,
      data: {
        activeListings: parseInt(stats.active_listings) || 0,
        pendingQuotes: parseInt(stats.pending_quotes) || 0,
        completedOrders: 0, // Temporary
        monthlyRevenue: parseFloat(stats.monthly_revenue) || 0,
        totalQuotes: 0, // Temporary
        acceptanceRate: 0, // Temporary
        avgResponseTime: 0 // Temporary
      }
    });

  } catch (error: any) {
    // During build, return empty data instead of error
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        success: true,
        data: {
          activeListings: 0,
          pendingQuotes: 0,
          completedOrders: 0,
          monthlyRevenue: 0,
          totalQuotes: 0,
          acceptanceRate: 0,
          avgResponseTime: 0
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stats'
    }, { status: 500 });
  }
}