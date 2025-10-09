import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent, PAYMENT_CONFIG, PaymentSecurity } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    const {
      amount,
      currency = PAYMENT_CONFIG.currency,
      orderId,
      buyerId,
      supplierId,
      quoteId,
      buyerEmail,
      description,
      metadata = {}
    } = body;

    // Validation
    if (!amount || !orderId || !buyerId || !supplierId || !quoteId || !buyerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, orderId, buyerId, supplierId, quoteId, buyerEmail' },
        { status: 400 }
      );
    }

    // Validate amount
    if (!PaymentSecurity.validateAmount(amount)) {
      return NextResponse.json(
        {
          error: `Amount must be between J$${PAYMENT_CONFIG.minimumAmount/100} and J$${PAYMENT_CONFIG.maximumAmount/100}`
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get client IP for security logging
    const clientIP = req.ip ||
                     req.headers.get('x-forwarded-for')?.split(',')[0] ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    // Log payment attempt for security monitoring
    PaymentSecurity.logPaymentAttempt({
      userId: buyerId,
      amount,
      ip: clientIP,
      userAgent: req.headers.get('user-agent') || 'unknown'
    });

    // Sanitize metadata
    const sanitizedMetadata = PaymentSecurity.sanitizeMetadata({
      ...metadata,
      orderId,
      buyerId,
      supplierId,
      quoteId,
      clientIP,
      requestTimestamp: new Date().toISOString()
    });

    // Create payment intent
    const paymentIntentData = await createPaymentIntent({
      amount,
      currency,
      orderId,
      buyerId,
      supplierId,
      quoteId,
      buyerEmail,
      description: description || `Auto part purchase - Order ${orderId}`,
      metadata: sanitizedMetadata
    });

    console.log(`Payment intent created successfully: ${paymentIntentData.paymentIntentId} for order ${orderId}`);

    // Return client secret and payment details
    return NextResponse.json({
      success: true,
      clientSecret: paymentIntentData.clientSecret,
      paymentIntentId: paymentIntentData.paymentIntentId,
      amount: paymentIntentData.amount,
      platformFee: paymentIntentData.platformFee,
      currency: currency.toUpperCase(),
      config: {
        minimumAmount: PAYMENT_CONFIG.minimumAmount,
        maximumAmount: PAYMENT_CONFIG.maximumAmount,
        platformFeePercentage: PAYMENT_CONFIG.platformFeePercentage,
        escrowHoldDays: PAYMENT_CONFIG.escrowHoldDays
      }
    });

  } catch (error: any) {
    console.error('Payment intent creation error:', error);

    // Log error for monitoring
    console.error('Payment Intent Error Details:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      body: req.body
    });

    // Return appropriate error message
    if (error.message.includes('Amount must be')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error.message.includes('Payment intent creation failed')) {
      return NextResponse.json(
        { error: 'Payment processing temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    // Generic error for security
    return NextResponse.json(
      { error: 'Payment setup failed. Please try again or contact support.' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve payment status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentIntentId = searchParams.get('payment_intent');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you might want to verify that the user
    // has permission to access this payment intent

    const { getPaymentStatus } = await import('@/lib/stripe');
    const paymentStatus = await getPaymentStatus(paymentIntentId);

    return NextResponse.json({
      success: true,
      payment: paymentStatus
    });

  } catch (error: any) {
    console.error('Payment status retrieval error:', error);

    return NextResponse.json(
      { error: 'Unable to retrieve payment status' },
      { status: 500 }
    );
  }
}
