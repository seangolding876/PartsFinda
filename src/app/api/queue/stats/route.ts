import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Total processed requests
    const totalQuery = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM request_queue
    `;

    // Today's stats
    const todayQuery = `
      SELECT 
        COUNT(*) as processed_today,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_today,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_today
      FROM request_queue 
      WHERE DATE(created_at) = CURDATE() OR DATE(processed_at) = CURDATE()
    `;

    // Pending requests with details
    const pendingQuery = `
      SELECT 
        rq.id,
        pr.urgency,
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

    const [totalStats, todayStats, pendingRequests] = await Promise.all([
      query(totalQuery),
      query(todayQuery),
      query(pendingQuery)
    ]);

    console.log('🔍 Database Query Results:', {
      totalStats,
      todayStats, 
      pendingRequests
    });

    // ✅ Properly handle database results
    let pendingArray = [];
    
    if (pendingRequests && Array.isArray(pendingRequests)) {
      // Check if it's a query result object with rows property
      if (pendingRequests[0] && pendingRequests[0].rows && Array.isArray(pendingRequests[0].rows)) {
        pendingArray = pendingRequests[0].rows;
      } 
      // Check if it's direct array of rows
      else if (pendingRequests[0] && Array.isArray(pendingRequests[0])) {
        pendingArray = pendingRequests[0];
      }
      // Check if it's already the data array
      else if (pendingRequests.length > 0 && pendingRequests[0].id) {
        pendingArray = pendingRequests;
      }
    }

    console.log('📊 Processed Pending Requests:', pendingArray);

    const stats = {
      total: {
        requests: parseInt(totalStats[0]?.total_requests) || 0,
        completed: parseInt(totalStats[0]?.completed) || 0,
        failed: parseInt(totalStats[0]?.failed) || 0,
        processing: parseInt(totalStats[0]?.processing) || 0,
        pending: parseInt(totalStats[0]?.pending) || 0
      },
      today: {
        processed: parseInt(todayStats[0]?.processed_today) || 0,
        completed: parseInt(todayStats[0]?.completed_today) || 0,
        failed: parseInt(todayStats[0]?.failed_today) || 0
      },
      pending_requests: pendingArray,
      success_rate: totalStats[0]?.total_requests ? 
        ((parseInt(totalStats[0].completed) / parseInt(totalStats[0].total_requests)) * 100).toFixed(1) + '%' : '0%'
    };

    console.log('✅ Final Stats:', stats);

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Queue stats error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch queue stats',
        details: error.message 
      },
      { status: 500 }
    );
  }
}