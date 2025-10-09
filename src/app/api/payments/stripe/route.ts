import { NextRequest, NextResponse } from 'next/server';

// This would normally use the Stripe SDK
// For demo purposes, we're simulating the payment flow

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded';
  client_secret: string;
  metadata: any;
}

// Subscription pricing in JMD
const SUBSCRIPTION_PRICES = {
  basic: 0,
  professional: 2500,
  enterprise: 5000
};

// Urgent request pricing in JMD
const URGENT_REQUEST_PRICES = {
  standard: 0,
  urgent: 500,
  premium: 1500
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, plan, priority, email, metadata } = body;

    // Validate input
    if (!type || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let amount = 0;
    let description = '';

    // Calculate amount based on payment type
    if (type === 'subscription') {
      if (!plan || !SUBSCRIPTION_PRICES.hasOwnProperty(plan)) {
        return NextResponse.json(
          { error: 'Invalid subscription plan' },
          { status: 400 }
        );
      }
      amount = SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES];
      description = `PartsFinda ${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`;
    } else if (type === 'urgent_request') {
      if (!priority || !URGENT_REQUEST_PRICES.hasOwnProperty(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority level' },
          { status: 400 }
        );
      }
      amount = URGENT_REQUEST_PRICES[priority as keyof typeof URGENT_REQUEST_PRICES];
      description = `PartsFinda ${priority.charAt(0).toUpperCase() + priority.slice(1)} Part Request`;
    } else {
      return NextResponse.json(
        { error: 'Invalid payment type' },
        { status: 400 }
      );
    }

    // Skip payment for free items
    if (amount === 0) {
      return NextResponse.json({
        success: true,
        paymentIntent: null,
        message: 'No payment required for this selection'
      });
    }

    // Simulate creating a Stripe payment intent
    // In production, this would use: stripe.paymentIntents.create()
    const paymentIntent: PaymentIntent = {
      id: `pi_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount * 100, // Convert to cents for Stripe
      currency: 'jmd',
      status: 'requires_payment_method',
      client_secret: `pi_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        email,
        type,
        plan: plan || null,
        priority: priority || null,
        ...metadata
      }
    };

    // Log the payment attempt (in production, save to database)
    console.log('Payment intent created:', {
      id: paymentIntent.id,
      amount: amount,
      description,
      email
    });

    return NextResponse.json({
      success: true,
      paymentIntent,
      amount,
      description,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo'
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

// Webhook handler for Stripe events
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Handle different Stripe webhook events
    switch (type) {
      case 'payment_intent.succeeded':
        // Update subscription status in database
        console.log('Payment succeeded:', data.object);
        // TODO: Update user subscription in database
        break;

      case 'payment_intent.payment_failed':
        // Handle failed payment
        console.log('Payment failed:', data.object);
        // TODO: Send notification to user
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Handle subscription changes
        console.log('Subscription event:', type, data.object);
        // TODO: Update subscription in database
        break;
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
