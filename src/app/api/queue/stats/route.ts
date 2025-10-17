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

    console.log('🔍 RAW Database Query Results:', {
      totalStats,
      todayStats, 
      pendingRequests
    });

    // ✅ FIX: Properly handle database response structure
    let pendingArray = [];
    
    // Check different possible response structures
    if (pendingRequests) {
      // Case 1: Direct array (most common)
      if (Array.isArray(pendingRequests)) {
        pendingArray = pendingRequests;
      }
      // Case 2: Object with rows property
      else if (pendingRequests.rows && Array.isArray(pendingRequests.rows)) {
        pendingArray = pendingRequests.rows;
      }
      // Case 3: Object with data property
      else if (pendingRequests.data && Array.isArray(pendingRequests.data)) {
        pendingArray = pendingRequests.data;
      }
      // Case 4: Single object in array
      else if (Array.isArray(pendingRequests) && pendingRequests.length > 0) {
        pendingArray = pendingRequests;
      }
    }

    console.log('📊 Processed Pending Requests Array:', pendingArray);
    console.log('📊 Pending Requests Count:', pendingArray.length);

    // ✅ FIX: Properly handle totalStats and todayStats
    const totalData = Array.isArray(totalStats) ? totalStats[0] : totalStats?.rows?.[0] || totalStats;
    const todayData = Array.isArray(todayStats) ? todayStats[0] : todayStats?.rows?.[0] || todayStats;

    console.log('📊 Total Stats Data:', totalData);
    console.log('📊 Today Stats Data:', todayData);

    // Structure the response data
    const stats = {
      total: {
        requests: parseInt(totalData?.total_requests) || 0,
        completed: parseInt(totalData?.completed) || 0,
        failed: parseInt(totalData?.failed) || 0,
        processing: parseInt(totalData?.processing) || 0,
        pending: parseInt(totalData?.pending) || 0
      },
      today: {
        processed: parseInt(todayData?.processed_today) || 0,
        completed: parseInt(todayData?.completed_today) || 0,
        failed: parseInt(todayData?.failed_today) || 0
      },
      pending_requests: pendingArray,
      success_rate: totalData?.total_requests ? 
        ((parseInt(totalData.completed) / parseInt(totalData.total_requests)) * 100).toFixed(1) + '%' : '0%'
    };

    console.log('✅ Final Stats Response:', JSON.stringify(stats, null, 2));

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
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}