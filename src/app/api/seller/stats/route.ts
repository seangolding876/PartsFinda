import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const sellerId = parseInt(userInfo.userId, 10);

    // Get seller stats
    const statsResult = await query(
      `SELECT 
        -- Active listings count
        (SELECT COUNT(*) FROM parts WHERE seller_id = $1 AND status = 'active') as active_listings,
        
        -- Pending quotes count (requests where seller hasn't quoted yet)
        (SELECT COUNT(*) FROM request_queue rq 
         JOIN part_requests pr ON rq.part_request_id = pr.id 
         WHERE rq.seller_id = $1 AND rq.status = 'processed'
         AND NOT EXISTS (SELECT 1 FROM request_quotes rqq WHERE rqq.request_id = pr.id AND rqq.seller_id = $1)
        ) as pending_quotes,
        
        -- Completed orders count
        (SELECT COUNT(*) FROM orders WHERE seller_id = $1 AND status = 'completed') as completed_orders,
        
        -- Monthly revenue
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders 
         WHERE seller_id = $1 AND status = 'completed' 
         AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
        ) as monthly_revenue,
        
        -- Total quotes submitted
        (SELECT COUNT(*) FROM request_quotes WHERE seller_id = $1) as total_quotes,
        
        -- Quote acceptance rate
        (SELECT 
          CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND((COUNT(CASE WHEN status = 'accepted' THEN 1 END) * 100.0 / COUNT(*)), 1)
          END
         FROM request_quotes WHERE seller_id = $1
        ) as acceptance_rate,
        
        -- Average response time (hours)
        (SELECT 
          COALESCE(AVG(EXTRACT(EPOCH FROM (rq.created_at - rqq.created_at)) / 3600), 0)
         FROM request_queue rq
         JOIN request_quotes rqq ON rq.part_request_id = rqq.request_id AND rq.seller_id = rqq.seller_id
         WHERE rq.seller_id = $1
        ) as avg_response_time_hours
      `,
      [sellerId]
    );

    const stats = statsResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        activeListings: parseInt(stats.active_listings) || 0,
        pendingQuotes: parseInt(stats.pending_quotes) || 0,
        completedOrders: parseInt(stats.completed_orders) || 0,
        monthlyRevenue: parseFloat(stats.monthly_revenue) || 0,
        totalQuotes: parseInt(stats.total_quotes) || 0,
        acceptanceRate: parseFloat(stats.acceptance_rate) || 0,
        avgResponseTime: parseFloat(stats.avg_response_time_hours) || 0
      }
    });

  } catch (error: any) {
    console.error('Error in seller stats API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}