// app/api/stripe/webhook/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('✅ Webhook received');
  return NextResponse.json({ 
    success: true, 
    message: 'Webhook working!' 
  });
}

// GET method bhi add karein test ke liye
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Webhook endpoint is active' 
  });
}