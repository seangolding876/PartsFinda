import Stripe from 'stripe';

// Environment-based configuration
const isProduction = process.env.NODE_ENV === 'production';

// Get Stripe keys with fallbacks
const stripeSecretKey = isProduction
  ? process.env.STRIPE_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;

export const stripePublishableKey = isProduction
  ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Create Stripe client with error handling
let stripe: Stripe;

try {
  if (stripeSecretKey && stripeSecretKey !== 'YOUR_STRIPE_SECRET_KEY_key') {
    stripe = new Stripe(stripeSecretKey, {
      typescript: true,
      apiVersion: '2023-10-16', // Use latest stable version
    });
    console.log('✅ Stripe client initialized successfully');
  } else {
    console.warn('⚠️ Stripe environment variables not configured. Payment processing disabled.');
    stripe = createMockStripeClient();
  }
} catch (error) {
  console.error('❌ Stripe initialization failed:', error);
  stripe = createMockStripeClient();
}

// Mock Stripe client for development/fallback
function createMockStripeClient(): any {
  const mockError = new Error('Mock mode: Stripe not configured. Please set STRIPE_SECRET_KEY environment variable for payment processing.');

  return {
    paymentIntents: {
      create: async () => { throw mockError; },
      retrieve: async () => { throw mockError; },
    },
    accounts: {
      create: async () => { throw mockError; },
    },
    accountLinks: {
      create: async () => { throw mockError; },
    },
    transfers: {
      create: async () => { throw mockError; },
    },
    refunds: {
      create: async () => { throw mockError; },
    },
    webhooks: {
      constructEvent: () => { throw mockError; },
    },
    customers: {
      create: async () => { throw mockError; },
    },
    checkout: {
      sessions: {
        create: async () => { throw mockError; },
      },
    },
    subscriptions: {
      create: async () => { throw mockError; },
      retrieve: async () => { throw mockError; },
      update: async () => { throw mockError; },
    },
  };
}

export { stripe };

// Payment configuration
export const PAYMENT_CONFIG = {
  currency: 'jmd', // Jamaican Dollar
  country: 'JM',
  platformFeePercentage: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '3.0'),
  escrowHoldDays: parseInt(process.env.ESCROW_HOLD_PERIOD_DAYS || '7'),
  minimumAmount: 100, // J$1.00 minimum
  maximumAmount: 10000000, // J$100,000 maximum
};

// Create a payment intent with escrow functionality
export async function createPaymentIntent({
  amount,
  currency = PAYMENT_CONFIG.currency,
  orderId,
  buyerId,
  supplierId,
  quoteId,
  buyerEmail,
  description,
  metadata = {},
}: {
  amount: number;
  currency?: string;
  orderId: string;
  buyerId: string;
  supplierId: string;
  quoteId: string;
  buyerEmail: string;
  description: string;
  metadata?: Record<string, string>;
}) {
  try {
    // Validate amount
    if (amount < PAYMENT_CONFIG.minimumAmount || amount > PAYMENT_CONFIG.maximumAmount) {
      throw new Error(`Amount must be between J$${PAYMENT_CONFIG.minimumAmount/100} and J$${PAYMENT_CONFIG.maximumAmount/100}`);
    }

    // Calculate platform fee
    const platformFee = Math.round(amount * (PAYMENT_CONFIG.platformFeePercentage / 100));

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      receipt_email: buyerEmail,
      description,
      metadata: {
        orderId,
        buyerId,
        supplierId,
        quoteId,
        platformFee: platformFee.toString(),
        environment: isProduction ? 'production' : 'test',
        ...metadata,
      },
      payment_method_types: ['card'],
      capture_method: 'automatic', // Automatically capture payment
      setup_future_usage: 'off_session', // Allow saving payment method for future use
    });

    console.log(`Payment intent created: ${paymentIntent.id} for order ${orderId}`);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      platformFee,
    };

  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    throw new Error(`Payment intent creation failed: ${error.message}`);
  }
}

// Create connected account for suppliers (for future direct payments)
export async function createConnectedAccount({
  supplierId,
  email,
  businessName,
  country = 'JM',
  businessType = 'company',
}: {
  supplierId: string;
  email: string;
  businessName: string;
  country?: string;
  businessType?: string;
}) {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      business_type: businessType as any,
      metadata: {
        supplierId,
        platform: 'partsfinda',
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: businessName,
        product_description: 'Auto parts sales in Jamaica',
        support_email: email,
      },
    });

    console.log(`Connected account created: ${account.id} for supplier ${supplierId}`);
    return account;

  } catch (error: any) {
    console.error('Error creating connected account:', error);
    throw new Error(`Connected account creation failed: ${error.message}`);
  }
}

// Create account link for supplier onboarding
export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return accountLink.url;

  } catch (error: any) {
    console.error('Error creating account link:', error);
    throw new Error(`Account link creation failed: ${error.message}`);
  }
}

// Transfer funds to supplier (after escrow period)
export async function transferToSupplier({
  amount,
  supplierId,
  orderId,
  stripeAccountId,
}: {
  amount: number;
  supplierId: string;
  orderId: string;
  stripeAccountId: string;
}) {
  try {
    // Calculate amount after platform fee
    const platformFee = Math.round(amount * (PAYMENT_CONFIG.platformFeePercentage / 100));
    const transferAmount = amount - platformFee;

    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: PAYMENT_CONFIG.currency,
      destination: stripeAccountId,
      metadata: {
        orderId,
        supplierId,
        originalAmount: amount.toString(),
        platformFee: platformFee.toString(),
        transferAmount: transferAmount.toString(),
      },
    });

    console.log(`Transfer created: ${transfer.id} for supplier ${supplierId}, amount: ${transferAmount}`);
    return transfer;

  } catch (error: any) {
    console.error('Error creating transfer:', error);
    throw new Error(`Transfer creation failed: ${error.message}`);
  }
}

// Create refund
export async function createRefund({
  paymentIntentId,
  amount,
  reason,
  orderId,
}: {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
  orderId: string;
}) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason: reason as any,
      metadata: {
        orderId,
        refundReason: reason || 'requested_by_customer',
      },
    });

    console.log(`Refund created: ${refund.id} for payment intent ${paymentIntentId}`);
    return refund;

  } catch (error: any) {
    console.error('Error creating refund:', error);
    throw new Error(`Refund creation failed: ${error.message}`);
  }
}

// Validate webhook signature
export function validateWebhookSignature(body: string, signature: string): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    throw new Error(`Webhook signature validation failed: ${error.message}`);
  }
}

// Get payment status
export async function getPaymentStatus(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    };
  } catch (error: any) {
    console.error('Error retrieving payment status:', error);
    throw new Error(`Payment status retrieval failed: ${error.message}`);
  }
}

// Escrow management functions
export class EscrowManager {
  static async holdPayment(paymentIntentId: string, holdUntilDate: Date) {
    // In a real implementation, this would update your database
    console.log(`Holding payment ${paymentIntentId} until ${holdUntilDate.toISOString()}`);

    // Schedule automatic release (you might use a job queue like Bull or cron job)
    return {
      paymentIntentId,
      status: 'holding',
      releaseDate: holdUntilDate,
    };
  }

  static async releasePayment(paymentIntentId: string, supplierId: string, stripeAccountId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment must be succeeded to release funds');
      }

      // Transfer to supplier
      const transfer = await transferToSupplier({
        amount: paymentIntent.amount,
        supplierId,
        orderId: paymentIntent.metadata.orderId,
        stripeAccountId,
      });

      console.log(`Escrow released for payment ${paymentIntentId}, transfer: ${transfer.id}`);
      return transfer;

    } catch (error: any) {
      console.error('Error releasing escrow payment:', error);
      throw new Error(`Escrow release failed: ${error.message}`);
    }
  }

  static async cancelEscrow(paymentIntentId: string, reason: string) {
    try {
      // Create full refund
      const refund = await createRefund({
        paymentIntentId,
        reason,
        orderId: 'escrow_cancellation',
      });

      console.log(`Escrow canceled for payment ${paymentIntentId}, refund: ${refund.id}`);
      return refund;

    } catch (error: any) {
      console.error('Error canceling escrow:', error);
      throw new Error(`Escrow cancellation failed: ${error.message}`);
    }
  }
}

// Payment security utilities
export class PaymentSecurity {
  static validateAmount(amount: number): boolean {
    return amount >= PAYMENT_CONFIG.minimumAmount && amount <= PAYMENT_CONFIG.maximumAmount;
  }

  static sanitizeMetadata(metadata: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string' && value.length <= 500) {
        sanitized[key] = value;
      } else if (typeof value === 'number') {
        sanitized[key] = value.toString();
      }
    }

    return sanitized;
  }

  static logPaymentAttempt(data: {
    userId: string;
    amount: number;
    ip?: string;
    userAgent?: string;
  }) {
    console.log('Payment attempt logged:', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // In production, log to your security monitoring system
  }
}

export default stripe;
