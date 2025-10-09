import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle different event types
    if (event.type === 'payment_intent.succeeded') {
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
    } else if (event.type === 'payment_intent.payment_failed') {
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
    } else if (event.type === 'payment_intent.canceled') {
      await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
    } else if (event.type === 'transfer.created') {
      await handleTransferCreated(event.data.object as Stripe.Transfer);
    } else if (event.type === 'transfer.updated') {
      await handleTransferUpdated(event.data.object as Stripe.Transfer);
    } else {
      console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  try {
    // Extract order information from metadata
    const { orderId, supplierId, buyerId, quoteId } = paymentIntent.metadata;

    if (!orderId || !supplierId || !buyerId) {
      throw new Error('Missing required metadata in payment intent');
    }

    // Update order status to "payment_received"
    await updateOrderStatus(orderId, 'payment_received', {
      paymentIntentId: paymentIntent.id,
      amountReceived: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentMethod: paymentIntent.payment_method_types[0],
      timestamp: new Date().toISOString()
    });

    // Start escrow hold period (funds held for 7 days by default)
    const escrowHoldDays = parseInt(process.env.ESCROW_HOLD_PERIOD_DAYS || '7');
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + escrowHoldDays);

    await createEscrowRecord({
      orderId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      supplierId,
      buyerId,
      holdUntil: releaseDate.toISOString(),
      status: 'holding'
    });

    // Send notifications
    await sendPaymentConfirmationEmails({
      orderId,
      buyerId,
      supplierId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });

    // Log the successful payment
    await logPaymentEvent({
      type: 'payment_succeeded',
      paymentIntentId: paymentIntent.id,
      orderId,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata
    });

    console.log(`Payment ${paymentIntent.id} processed successfully for order ${orderId}`);

  } catch (error) {
    console.error('Error handling payment success:', error);

    // Log the error for admin review
    await logPaymentError({
      type: 'payment_processing_error',
      paymentIntentId: paymentIntent.id,
      error: error.message,
      metadata: paymentIntent.metadata
    });
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  try {
    const { orderId, buyerId, supplierId } = paymentIntent.metadata;

    if (orderId) {
      await updateOrderStatus(orderId, 'payment_failed', {
        paymentIntentId: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });

      // Notify relevant parties
      await sendPaymentFailureNotifications({
        orderId,
        buyerId,
        supplierId,
        reason: paymentIntent.last_payment_error?.message || 'Payment failed'
      });
    }

    await logPaymentEvent({
      type: 'payment_failed',
      paymentIntentId: paymentIntent.id,
      orderId,
      error: paymentIntent.last_payment_error?.message,
      metadata: paymentIntent.metadata
    });

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment canceled:', paymentIntent.id);

  try {
    const { orderId } = paymentIntent.metadata;

    if (orderId) {
      await updateOrderStatus(orderId, 'payment_canceled', {
        paymentIntentId: paymentIntent.id,
        timestamp: new Date().toISOString()
      });
    }

    await logPaymentEvent({
      type: 'payment_canceled',
      paymentIntentId: paymentIntent.id,
      orderId,
      metadata: paymentIntent.metadata
    });

  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  console.log('Transfer created:', transfer.id);

  try {
    // Log transfer for escrow release tracking
    await logPaymentEvent({
      type: 'transfer_created',
      transferId: transfer.id,
      amount: transfer.amount,
      destination: transfer.destination,
      metadata: transfer.metadata
    });

  } catch (error) {
    console.error('Error handling transfer creation:', error);
  }
}

async function handleTransferUpdated(transfer: Stripe.Transfer) {
  console.log('Transfer updated:', transfer.id);

  try {
    // Update escrow status if transfer is completed
    if (transfer.metadata.orderId) {
      await updateEscrowStatus(transfer.metadata.orderId, 'released', {
        transferId: transfer.id,
        amount: transfer.amount,
        completedAt: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error handling transfer update:', error);
  }
}

// Additional webhook handlers can be added here as needed

// Database helper functions (implement these with your database)
async function updateOrderStatus(orderId: string, status: string, metadata: any) {
  console.log(`Updating order ${orderId} status to ${status}`, metadata);
  // Implement database update logic
}

async function createEscrowRecord(escrowData: any) {
  console.log('Creating escrow record:', escrowData);
  // Implement escrow record creation
}

async function updateEscrowStatus(orderId: string, status: string, metadata: any) {
  console.log(`Updating escrow for order ${orderId} to ${status}`, metadata);
  // Implement escrow status update
}

async function logPaymentEvent(eventData: any) {
  console.log('Logging payment event:', eventData);
  // Implement payment event logging
}

async function logPaymentError(errorData: any) {
  console.error('Logging payment error:', errorData);
  // Implement error logging
}

// Notification helper functions
async function sendPaymentConfirmationEmails(data: any) {
  console.log('Sending payment confirmation emails:', data);
  // Implement email notifications
}

async function sendPaymentFailureNotifications(data: any) {
  console.log('Sending payment failure notifications:', data);
  // Implement failure notifications
}

async function sendAdminNotification(data: any) {
  console.log('Sending admin notification:', data);
  // Implement admin notifications
}
