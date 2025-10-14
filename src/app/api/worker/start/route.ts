import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple mock worker for now
let workerStatus = {
  isRunning: false,
  processed: 0,
  failed: 0,
  retried: 0,
  lastUpdated: new Date().toISOString()
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'start') {
      workerStatus = {
        isRunning: true,
        processed: 0,
        failed: 0,
        retried: 0,
        lastUpdated: new Date().toISOString()
      };
      
      return NextResponse.json({ 
        success: true, 
        message: 'Worker started successfully',
        status: workerStatus
      });
    }

    if (action === 'status') {
      // Mock data for demonstration
      const mockStats = {
        status: [
          { status: 'pending', count: '5', avg_delay_seconds: 3600, max_retries: 0 },
          { status: 'processed', count: '25', avg_delay_seconds: 120, max_retries: 0 },
          { status: 'failed', count: '2', avg_delay_seconds: null, max_retries: 3 }
        ],
        pendingDetails: {
          total_pending: '5',
          avg_delay_seconds: 3600,
          oldest_pending: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        workerStats: workerStatus
      };

      return NextResponse.json({
        success: true,
        ...mockStats
      });
    }

    if (action === 'stop') {
      workerStatus.isRunning = false;
      return NextResponse.json({
        success: true,
        message: 'Worker stopped',
        status: workerStatus
      });
    }

    // Default response
    return NextResponse.json({
      success: true,
      message: 'Worker API is running',
      available_actions: ['start', 'status', 'stop'],
      current_status: workerStatus
    });

  } catch (error: any) {
    console.error('Error in worker API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}