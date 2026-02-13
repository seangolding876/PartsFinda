import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import smsQueueService from '@/lib/sms-queue-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // ============= 1. BEARER TOKEN AUTH =============
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Bearer token required' 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    let userInfo;
    
    try {
      userInfo = verifyToken(token);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    // ============= 2. CHECK ADMIN ROLE =============
    const userCheck = await query(
      'SELECT role FROM users WHERE id = $1',
      [userInfo.userId]
    );
    
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Sirf admin ya worker role allow karo
    const role = userCheck.rows[0].role;
    if (role !== 'admin' && role !== 'worker') {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    // ============= 3. GET LIMIT FROM URL =============
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const safeLimit = Math.min(limit, 100); // Max 100 at a time

    console.log(`🚀 SMS Worker started by ${role} (ID: ${userInfo.userId})`);

    // ============= 4. PROCESS PENDING SMS =============
    const results = await smsQueueService.processPendingSms(safeLimit);
    
    // ============= 5. GET QUEUE STATS =============
    const stats = await smsQueueService.getQueueStats();

    // ============= 6. RETURN RESPONSE =============
    return NextResponse.json({
      success: true,
      message: 'SMS worker executed successfully',
      data: {
        processed: results.processed,
        successful: results.successful,
        failed: results.failed
      },
      queue: {
        pending: parseInt(stats?.pending_count || '0'),
        processing: parseInt(stats?.processing_count || '0'),
        failed: parseInt(stats?.failed_count || '0'),
        sent_today: parseInt(stats?.sent_count || '0'),
        avg_wait_time: parseFloat(stats?.avg_wait_time_seconds || '0').toFixed(2)
      },
      meta: {
        executed_by: {
          id: userInfo.userId,
          role: role
        },
        timestamp: new Date().toISOString(),
        limit: safeLimit
      }
    });

  } catch (error: any) {
    console.error('❌ SMS Worker Error:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process SMS queue',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// POST method - same as GET
export async function POST(request: NextRequest) {
  return GET(request);
}