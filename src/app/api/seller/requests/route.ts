import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

// GET - Fetch all requests
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const sellerId = parseInt(userInfo.userId, 10);

    const requestsResult = await query(
      `SELECT 
        pr.id as request_id,
        pr.part_name,
        pr.budget,
        pr.parish,
        pr.urgency,
        pr.description,
        pr.vehicle_year,
        pr.make_name,
        pr.model_name,
        u.name as buyer_name,
        u.email as buyer_email,
        u.phone as buyer_phone,
        pr.expires_at,
        pr.created_at,
        rq.processed_at,
        rq.status as queue_status,
        EXISTS(
          SELECT 1 FROM request_quotes rq2 
          WHERE rq2.request_id = pr.id AND rq2.seller_id = $1
        ) as has_quoted,
        COALESCE(
          (SELECT COUNT(*) FROM request_quotes rq3 WHERE rq3.request_id = pr.id), 0
        ) as total_quotes
       FROM request_queue rq
       JOIN part_requests pr ON rq.part_request_id = pr.id
       JOIN users u ON pr.user_id = u.id
       WHERE rq.seller_id = $1 AND rq.status = 'processed'
       ORDER BY rq.processed_at DESC`,
      [sellerId]
    );

    const requests = requestsResult.rows.map(request => ({
      id: request.request_id,
      partName: request.part_name,
      budget: request.budget,
      parish: request.parish,
      urgency: request.urgency,
      description: request.description,
      vehicleYear: request.vehicle_year,
      makeName: request.make_name,
      modelName: request.model_name,
      buyerName: request.buyer_name,
      buyerEmail: request.buyer_email,
      buyerPhone: request.buyer_phone,
      expiresAt: request.expires_at,
      createdAt: request.created_at,
      processedAt: request.processed_at,
      queueStatus: request.queue_status,
      hasQuoted: request.has_quoted,
      totalQuotes: request.total_quotes
    }));

    return NextResponse.json({
      success: true,
      data: requests
    });

  } catch (error: any) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch requests'
    }, { status: 500 });
  }
}