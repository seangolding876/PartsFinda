import { NextRequest, NextResponse } from 'next/server';
import RequestProcessor from '../../../../../worker/requestProcessor';

let processor: RequestProcessor | null = null;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'start') {
      if (!processor) {
        processor = new RequestProcessor();
        await processor.start();
        return NextResponse.json({ 
          success: true, 
          message: 'Production worker started successfully',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Worker is already running',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'status') {
      if (!processor) {
        return NextResponse.json({ 
          success: false, 
          error: 'Worker not started',
          workerRunning: false
        });
      }
      
      const queueStatus = await processor.getQueueStatus();
      
      return NextResponse.json({
        success: true,
        workerRunning: true,
        ...queueStatus,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'stop') {
      processor = null;
      return NextResponse.json({
        success: true,
        message: 'Worker stopped',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: start, status, or stop'
    }, { status: 400 });

  } catch (error: any) {
    console.error('Error in worker API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';