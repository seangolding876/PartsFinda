import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Socket server is running',
    timestamp: new Date().toISOString()
  });
}