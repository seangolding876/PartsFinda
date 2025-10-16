import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Socket server health check
    const response = await fetch('http://localhost:3001/health');
    
    if (response.ok) {
      const socketHealth = await response.json();
      return NextResponse.json({
        status: 'ok',
        message: 'Socket server is running',
        socketHealth: socketHealth,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: 'error', 
        message: 'Socket server not responding',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Socket server connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}