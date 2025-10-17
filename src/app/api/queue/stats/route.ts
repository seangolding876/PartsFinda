// app/api/queue/stats/route.js
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Total requests query
    const totalQuery = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM request_queue
    `;

    // Today's stats query
    const todayQuery = `
      SELECT 
        COUNT(*) as processed_today,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_today,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_today
      FROM request_queue 
      WHERE DATE(created_at) = CURRENT_DATE OR DATE(processed_at) = CURRENT_DATE
    `;

    // Pending requests with details query
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

    // Execute queries
    const [totalStats, todayStats, pendingRequests] = await Promise.all([
      query(totalQuery),
      query(todayQuery),
      query(pendingQuery)
    ]);

    console.log('🔍 Database Query Results:', {
      totalStats: totalStats.rows,
      todayStats: todayStats.rows, 
      pendingRequests: pendingRequests.rows
    });

    // Process pending requests data
    let pendingArray = [];
    
    if (pendingRequests && pendingRequests.rows) {
      pendingArray = pendingRequests.rows;
    } else if (pendingRequests && Array.isArray(pendingRequests)) {
      pendingArray = pendingRequests;
    }

    console.log('📊 Processed Pending Requests:', pendingArray);

    // Structure the response data
    const stats = {
      total: {
        requests: parseInt(totalStats.rows?.[0]?.total_requests) || 0,
        completed: parseInt(totalStats.rows?.[0]?.completed) || 0,
        failed: parseInt(totalStats.rows?.[0]?.failed) || 0,
        processing: parseInt(totalStats.rows?.[0]?.processing) || 0,
        pending: parseInt(totalStats.rows?.[0]?.pending) || 0
      },
      today: {
        processed: parseInt(todayStats.rows?.[0]?.processed_today) || 0,
        completed: parseInt(todayStats.rows?.[0]?.completed_today) || 0,
        failed: parseInt(todayStats.rows?.[0]?.failed_today) || 0
      },
      pending_requests: pendingArray,
      success_rate: totalStats.rows?.[0]?.total_requests ? 
        ((parseInt(totalStats.rows[0].completed) / parseInt(totalStats.rows[0].total_requests)) * 100).toFixed(1) + '%' : '0%'
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