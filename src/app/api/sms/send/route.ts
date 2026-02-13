import { NextRequest, NextResponse } from 'next/server';
import twilioService from '@/lib/twilio-service';
import type { SmsOptions } from '@/types/twilio.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message } = body as SmsOptions;

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    const result = await twilioService.sendSMS({ to, message });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}