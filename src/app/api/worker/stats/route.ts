// app/api/worker/stats/route.js
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET(request: NextRequest) {
  try {
    // Worker process stats query
    const workerStatsQuery = `
      SELECT 
        COUNT(*) as total_processed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as total_failed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as total_completed,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as currently_processing
      FROM request_queue 
      WHERE processed_at IS NOT NULL OR status = 'processing'
    `;

    // Pending requests stats query
    const pendingStatsQuery = `
      SELECT 
        COUNT(*) as total_pending,
        COUNT(CASE WHEN pr.urgency = 'high' THEN 1 END) as high_urgency,
        COUNT(CASE WHEN s.membership_plan = 'premium' THEN 1 END) as premium_sellers,
        AVG(pr.budget) as avg_budget
      FROM request_queue rq
      JOIN part_requests pr ON rq.part_request_id = pr.id
      JOIN users s ON rq.seller_id = s.id
      WHERE rq.processed_at IS NULL AND rq.status = 'pending'
    `;

    // Today's stats query
    const todayStatsQuery = `
      SELECT 
        COUNT(*) as processed_today,
        SUM(CASE WHEN rq.status = 'completed' THEN 1 ELSE 0 END) as success_today,
        SUM(CASE WHEN rq.status = 'failed' THEN 1 ELSE 0 END) as failed_today
      FROM request_queue rq
      WHERE DATE(rq.processed_at) = CURRENT_DATE
    `;

    // Queue details for monitoring
    const queueDetailsQuery = `
      SELECT 
        rq.id, 
        rq.part_request_id,
        rq.status,
        pr.urgency,
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
          WHEN pr.urgency = 'high' THEN 1
          WHEN pr.urgency = 'medium' THEN 2
          ELSE 3
        END,
        rq.created_at DESC
      LIMIT 50
    `;

    // Execute all queries in parallel
    const [workerStats, pendingStats, todayStats, queueDetails] = await Promise.all([
      query(workerStatsQuery),
      query(pendingStatsQuery),
      query(todayStatsQuery),
      query(queueDetailsQuery)
    ]);

    // Process and structure the data
    const stats = {
      worker: {
        total_processed: parseInt(workerStats.rows?.[0]?.total_processed) || 0,
        total_failed: parseInt(workerStats.rows?.[0]?.total_failed) || 0,
        total_completed: parseInt(workerStats.rows?.[0]?.total_completed) || 0,
        currently_processing: parseInt(workerStats.rows?.[0]?.currently_processing) || 0,
        success_rate: workerStats.rows?.[0]?.total_processed ? 
          ((parseInt(workerStats.rows[0].total_completed) / parseInt(workerStats.rows[0].total_processed)) * 100).toFixed(1) + '%' : '0%'
      },
      pending: {
        total_pending: parseInt(pendingStats.rows?.[0]?.total_pending) || 0,
        high_urgency: parseInt(pendingStats.rows?.[0]?.high_urgency) || 0,
        premium_sellers: parseInt(pendingStats.rows?.[0]?.premium_sellers) || 0,
        avg_budget: parseFloat(pendingStats.rows?.[0]?.avg_budget) || 0
      },
      today: {
        processed_today: parseInt(todayStats.rows?.[0]?.processed_today) || 0,
        success_today: parseInt(todayStats.rows?.[0]?.success_today) || 0,
        failed_today: parseInt(todayStats.rows?.[0]?.failed_today) || 0,
        success_rate_today: todayStats.rows?.[0]?.processed_today ? 
          ((parseInt(todayStats.rows[0].success_today) / parseInt(todayStats.rows[0].processed_today)) * 100).toFixed(1) + '%' : '0%'
      },
      queue_details: queueDetails.rows || []
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching worker stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch worker stats',
        details: error.message 
      },
      { status: 500 }
    );
  }
}