import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get worker process stats
    const workerStatsQuery = `
      SELECT 
        COUNT(*) as total_processed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as total_failed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as total_completed,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as currently_processing
      FROM request_queue 
      WHERE processed_at IS NOT NULL OR status = 'processing'
    `;

    // Get pending requests stats
    const pendingStatsQuery = `
      SELECT 
        COUNT(*) as total_pending,
        COUNT(CASE WHEN rq.priority = 'high' THEN 1 END) as high_priority,
        COUNT(CASE WHEN s.membership_plan = 'premium' THEN 1 END) as premium_sellers,
        AVG(pr.budget) as avg_budget
      FROM request_queue rq
      JOIN part_requests pr ON rq.part_request_id = pr.id
      JOIN users s ON rq.seller_id = s.id
      WHERE rq.processed_at IS NULL AND rq.status = 'pending'
    `;

    // Get today's stats
    const todayStatsQuery = `
      SELECT 
        COUNT(*) as processed_today,
        SUM(CASE WHEN rq.status = 'completed' THEN 1 ELSE 0 END) as success_today,
        SUM(CASE WHEN rq.status = 'failed' THEN 1 ELSE 0 END) as failed_today
      FROM request_queue rq
      WHERE DATE(rq.processed_at) = CURDATE()
    `;

    // Get queue details for monitoring
    const queueDetailsQuery = `
      SELECT 
        rq.id, 
        rq.part_request_id,
        rq.status,
        rq.priority,
        rq.created_at as queued_at,
        rq.processed_at,
        pr.part_name, 
        pr.description,
        pr.budget,
        s.id as seller_id,
        s.name as seller_name,
        s.email as seller_email,
        s.membership_plan,
        u.name as buyer_name
      FROM request_queue rq
      JOIN part_requests pr ON rq.part_request_id = pr.id
      JOIN users s ON rq.seller_id = s.id
      JOIN users u ON pr.user_id = u.id
      WHERE rq.processed_at IS NULL OR rq.status = 'processing'
      ORDER BY 
        CASE 
          WHEN rq.priority = 'high' THEN 1
          WHEN rq.priority = 'medium' THEN 2
          ELSE 3
        END,
        rq.created_at
      LIMIT 50
    `;

    const [workerStats, pendingStats, todayStats, queueDetails] = await Promise.all([
      query(workerStatsQuery),
      query(pendingStatsQuery),
      query(todayStatsQuery),
      query(queueDetailsQuery)
    ]);

    const stats = {
      worker: {
        total_processed: workerStats[0]?.total_processed || 0,
        total_failed: workerStats[0]?.total_failed || 0,
        total_completed: workerStats[0]?.total_completed || 0,
        currently_processing: workerStats[0]?.currently_processing || 0,
        success_rate: workerStats[0]?.total_processed ? 
          ((workerStats[0].total_completed / workerStats[0].total_processed) * 100).toFixed(1) + '%' : '0%'
      },
      pending: {
        total_pending: pendingStats[0]?.total_pending || 0,
        high_priority: pendingStats[0]?.high_priority || 0,
        premium_sellers: pendingStats[0]?.premium_sellers || 0,
        avg_budget: pendingStats[0]?.avg_budget || 0
      },
      today: {
        processed_today: todayStats[0]?.processed_today || 0,
        success_today: todayStats[0]?.success_today || 0,
        failed_today: todayStats[0]?.failed_today || 0,
        success_rate_today: todayStats[0]?.processed_today ? 
          ((todayStats[0].success_today / todayStats[0].processed_today) * 100).toFixed(1) + '%' : '0%'
      },
      queue_details: queueDetails
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching worker stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch worker stats' },
      { status: 500 }
    );
  }
}