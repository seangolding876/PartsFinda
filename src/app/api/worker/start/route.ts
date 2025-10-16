import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'status':
        // Return worker status
        return NextResponse.json({
          success: true,
          workerStatus: 'running', // or 'stopped' based on your actual worker
          lastActive: new Date().toISOString(),
          message: 'Worker is running'
        });

      case 'start':
        // Start worker logic here
        return NextResponse.json({
          success: true,
          message: 'Worker started successfully'
        });

      case 'stop':
        // Stop worker logic here
        return NextResponse.json({
          success: true,
          message: 'Worker stopped successfully'
        });

      case 'restart':
        // Restart worker logic here
        return NextResponse.json({
          success: true,
          message: 'Worker restarted successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Worker control error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to control worker'
    }, { status: 500 });
  }
}