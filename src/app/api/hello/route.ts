import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Hello from PartsFinda API!',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({
    message: 'POST request working!',
    timestamp: new Date().toISOString()
  });
}
