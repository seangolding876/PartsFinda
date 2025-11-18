import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const sellerId = parseInt(userInfo.userId, 10);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let statusCondition = "rq.status = 'processed'";
    if (status === 'pending') {
      statusCondition = "rq.status = 'pending'";
    }

    const requestsResult = await query(
      `SELECT 
        pr.id as request_id,
        pr.part_name,
        pr.part_number,
        pr.budget,
        pr.parish,
        pr.condition as part_condition,
        pr.urgency,
        pr.description,
        pr.vehicle_year,
        mk.name as make_name,
        md.name as model_name,
        u.name as buyer_name,
        u.email as buyer_email,
        u.phone as buyer_phone,
        pr.expires_at,
        pr.created_at as date_received,
        rq.id as queue_id,
        rq.processed_at,
        rq.status as queue_status,
        rq.scheduled_delivery_time,
        rq.isReject,
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
       JOIN makes mk ON pr.make_id = mk.id
       JOIN models md ON pr.model_id = md.id AND mk.id = md.make_id
       WHERE rq.seller_id = $1 AND ${statusCondition} AND (rq."isReject" = false OR rq."isReject" IS NULL)
       ORDER BY 
         CASE pr.urgency 
           WHEN 'high' THEN 1
           WHEN 'medium' THEN 2
           WHEN 'low' THEN 3
           ELSE 4
         END,
         rq.processed_at DESC`,
      [sellerId]
    );

    const requests = requestsResult.rows.map(request => ({
      id: request.request_id,
      queueId: request.queue_id,
      partName: request.part_name,
      partNumber: request.part_number,
      budget: parseFloat(request.budget),
      parish: request.parish,
      condition: request.part_condition,
      urgency: request.urgency,
      description: request.description,
      vehicleYear: request.vehicle_year,
      makeName: request.make_name,
      modelName: request.model_name,
      buyerName: request.buyer_name,
      buyerEmail: request.buyer_email,
      buyerPhone: request.buyer_phone,
      dateReceived: request.date_received,
      expiresAt: request.expires_at,
      queueStatus: request.queue_status,
      scheduledDelivery: request.scheduled_delivery,
      processedAt: request.processed_at,
      hasQuoted: request.has_quoted,
      quoted: request.has_quoted, // duplicate for compatibility
      totalQuotes: parseInt(request.total_quotes)
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