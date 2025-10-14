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

    // Verify user is a seller
    const userCheck = await query(
      'SELECT id, role FROM users WHERE id = $1 AND role = $2',
      [sellerId, 'seller']
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Seller not found or unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const status = searchParams.get('status') || 'all';

    if (action === 'getRequests') {
      // Get part requests for this seller from request_queue
      let whereClause = 'rq.seller_id = $1';
      const queryParams: any[] = [sellerId];

      if (status === 'pending') {
        whereClause += ' AND rq.status = $2';
        queryParams.push('pending');
      } else if (status === 'processed') {
        whereClause += ' AND rq.status = $2';
        queryParams.push('processed');
      }

      const requestsResult = await query(
        `SELECT 
          rq.id as queue_id,
          rq.status as queue_status,
          rq.scheduled_delivery_time,
          rq.processed_at,
          rq.created_at as received_at,
          pr.id as request_id,
          pr.part_name,
          pr.part_number,
          pr.description,
          pr.budget,
          pr.parish,
          pr.condition,
          pr.urgency,
          pr.vehicle_year,
          pr.created_at as request_created,
          pr.expires_at,
          u.name as buyer_name,
          u.email as buyer_email,
          u.phone as buyer_phone,
          m.name as make_name,
          md.name as model_name,
          (SELECT COUNT(*) FROM request_quotes rqq WHERE rqq.request_id = pr.id) as total_quotes,
          EXISTS(SELECT 1 FROM request_quotes rqq WHERE rqq.request_id = pr.id AND rqq.seller_id = $1) as has_quoted
         FROM request_queue rq
         JOIN part_requests pr ON rq.part_request_id = pr.id
         JOIN users u ON pr.user_id = u.id
         LEFT JOIN makes m ON pr.make_id = m.id
         LEFT JOIN models md ON pr.model_id = md.id
         WHERE ${whereClause}
         ORDER BY 
           CASE 
             WHEN pr.urgency = 'high' THEN 1
             WHEN pr.urgency = 'medium' THEN 2
             ELSE 3
           END,
           rq.scheduled_delivery_time ASC`,
        queryParams
      );

      const requests = requestsResult.rows.map(request => ({
        id: request.request_id,
        queueId: request.queue_id,
        partName: request.part_name,
        partNumber: request.part_number,
        description: request.description,
        budget: request.budget,
        parish: request.parish,
        condition: request.condition,
        urgency: request.urgency,
        vehicleYear: request.vehicle_year,
        makeName: request.make_name,
        modelName: request.model_name,
        buyerName: request.buyer_name,
        buyerEmail: request.buyer_email,
        buyerPhone: request.buyer_phone,
        dateReceived: request.received_at,
        expiresAt: request.expires_at,
        queueStatus: request.queue_status,
        scheduledDelivery: request.scheduled_delivery_time,
        processedAt: request.processed_at,
        totalQuotes: parseInt(request.total_quotes) || 0,
        hasQuoted: request.has_quoted,
        quoted: request.has_quoted // For frontend compatibility
      }));

      return NextResponse.json({
        success: true,
        data: requests
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Error in seller requests API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch requests',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}