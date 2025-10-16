import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Yeh route sirf socket server status batayega
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Socket.IO server is ready',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}