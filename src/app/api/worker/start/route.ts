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
          message: 'Worker started successfully' 
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Worker is already running' 
      });
    }

    if (action === 'status') {
      if (!processor) {
        return NextResponse.json({ 
          success: false, 
          error: 'Worker not started' 
        });
      }
      
      const queueStatus = await processor.getQueueStatus();
      return NextResponse.json({
        success: true,
        ...queueStatus
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: start or status'
    }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}