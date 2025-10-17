import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const totalQuery = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM request_queue
    `;

    const todayQuery = `
      SELECT 
        COUNT(*) as processed_today,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_today,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_today
      FROM request_queue 
      WHERE DATE(created_at) = CURRENT_DATE OR DATE(processed_at) = CURRENT_DATE
    `;

    const pendingQuery = `
      SELECT 
        rq.id,
        pr.urgency as priority,
        rq.created_at,
        pr.part_name,
        pr.budget,
        s.name as seller_name,
        s.membership_plan,
        u.name as buyer_name
      FROM request_queue rq
      JOIN part_requests pr ON rq.part_request_id = pr.id
      JOIN users s ON rq.seller_id = s.id
      JOIN users u ON pr.user_id = u.id
      WHERE rq.status = 'pending'
      ORDER BY 
        CASE pr.urgency 
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          ELSE 3
        END,
        rq.created_at
      LIMIT 20
    `;

    const normalizeResult = (res) => {
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (res.rows && Array.isArray(res.rows)) return res.rows;
      if (res.data && Array.isArray(res.data)) return res.data;
      if (res[0] && Array.isArray(res[0])) return res[0];
      return [res];
    };

    const [totalStatsRaw, todayStatsRaw, pendingRequestsRaw] = await Promise.all([
      query(totalQuery),
      query(todayQuery),
      query(pendingQuery),
    ]);

    const totalStats = normalizeResult(totalStatsRaw);
    const todayStats = normalizeResult(todayStatsRaw);
    const pendingRequests = normalizeResult(pendingRequestsRaw);

    const totalData = totalStats[0] || {};
    const todayData = todayStats[0] || {};

    const stats = {
      total: {
        requests: parseInt(totalData.total_requests) || 0,
        completed: parseInt(totalData.completed) || 0,
        failed: parseInt(totalData.failed) || 0,
        processing: parseInt(totalData.processing) || 0,
        pending: parseInt(totalData.pending) || 0,
      },
      today: {
        processed: parseInt(todayData.processed_today) || 0,
        completed: parseInt(todayData.completed_today) || 0,
        failed: parseInt(todayData.failed_today) || 0,
      },
      pending_requests: pendingRequests,
      success_rate:
        totalData.total_requests && parseInt(totalData.total_requests) > 0
          ? ((parseInt(totalData.completed) / parseInt(totalData.total_requests)) * 100).toFixed(1) + '%'
          : '0%',
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Queue stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch queue stats',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
