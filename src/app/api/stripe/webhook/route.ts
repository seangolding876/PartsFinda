// app/api/stripe/webhook/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Stripe initialization
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook received');
    
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    console.log('Body length:', body.length);
    console.log('Signature:', signature ? 'Present' : 'Missing');

    if (!signature) {
      console.error('❌ No Stripe signature');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ No webhook secret');
      return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 });
    }

    // Verify signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`✅ Webhook verified: ${event.type}`);

    // Simple response
    return NextResponse.json({ 
      success: true, 
      event: event.type,
      message: 'Webhook processed successfully' 
    });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook failed: ' + error.message },
      { status: 400 }
    );
  }
}

// GET method for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Stripe webhook endpoint is active!',
    timestamp: new Date().toISOString(),
    method: 'GET'
  });
}