import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// ✅ Simple dynamic export
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // For build time, return empty array
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const sellerId = parseInt(userInfo.userId, 10);

    // Simple query for build compatibility
    const requestsResult = await query(
      `SELECT 
        pr.id as request_id,
        pr.part_name,
        pr.budget,
        pr.parish,
        pr.urgency,
        u.name as buyer_name
       FROM request_queue rq
       JOIN part_requests pr ON rq.part_request_id = pr.id
       JOIN users u ON pr.user_id = u.id
       WHERE rq.seller_id = $1 AND rq.status = 'processed'
       LIMIT 10`,
      [sellerId]
    );

    const requests = requestsResult.rows.map(request => ({
      id: request.request_id,
      partName: request.part_name,
      budget: request.budget,
      parish: request.parish,
      urgency: request.urgency,
      buyerName: request.buyer_name,
      hasQuoted: false,
      quoted: false,
      totalQuotes: 0
    }));

    return NextResponse.json({
      success: true,
      data: requests
    });

  } catch (error: any) {
    // During build, return empty array instead of error
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch requests'
    }, { status: 500 });
  }
}