import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Authentication API is working!',
      timestamp: new Date().toISOString(),
      method: 'GET'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Test endpoint error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    return NextResponse.json({
      success: true,
      message: 'Authentication POST API is working!',
      receivedData: body,
      timestamp: new Date().toISOString(),
      method: 'POST'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Test POST endpoint error' },
      { status: 500 }
    );
  }
}
// Updated Sat Sep 20 02:18:12 UTC 2025
