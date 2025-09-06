import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key', {
  apiVersion: '2023-08-16',
});

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  seller_id?: string;
  seller_name?: string;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'usd', customerInfo, items, metadata } = body;

    // Validate required fields
    if (!amount || amount < 50) { // Minimum 50 cents
      return NextResponse.json(
        { error: 'Invalid amount. Minimum charge is $0.50' },
        { status: 400 }
      );
    }

    if (!customerInfo || !customerInfo.email) {
      return NextResponse.json(
        { error: 'Customer information is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }

    // Validate amount matches items total
    const calculatedAmount = items.reduce((sum: number, item: CartItem) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const tax = calculatedAmount * 0.08; // 8% tax
    const shipping = calculatedAmount > 100 ? 0 : 9.99; // Free shipping over $100
    const expectedTotal = Math.round((calculatedAmount + tax + shipping) * 100); // Convert to cents

    if (Math.abs(amount - expectedTotal) > 1) { // Allow 1 cent difference for rounding
      return NextResponse.json(
        { error: `Amount mismatch. Expected: ${expectedTotal}, received: ${amount}` },
        { status: 400 }
      );
    }

    try {
      if (process.env.STRIPE_SECRET_KEY === 'sk_test_mock_key') {
        // Mock payment intent for development
        const mockPaymentIntent = {
          id: `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
          amount: amount,
          currency: currency,
          status: 'requires_payment_method',
          created: Math.floor(Date.now() / 1000),
          customer: null,
          description: `PartsFinda order for ${items.length} items`,
          metadata: {
            customerEmail: customerInfo.email,
            customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
            itemCount: items.length.toString(),
            ...metadata
          }
        };

        console.log(`💳 Mock payment intent created: ${mockPaymentIntent.id} for $${(amount/100).toFixed(2)}`);

        return NextResponse.json({
          success: true,
          clientSecret: mockPaymentIntent.client_secret,
          paymentIntentId: mockPaymentIntent.id,
          amount: amount,
          currency: currency
        });
      }

      // Create or retrieve customer
      let customer = null;
      try {
        const existingCustomers = await stripe.customers.list({
          email: customerInfo.email,
          limit: 1
        });

        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
        } else {
          customer = await stripe.customers.create({
            email: customerInfo.email,
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            phone: customerInfo.phone,
            address: {
              line1: customerInfo.billingAddress.line1,
              line2: customerInfo.billingAddress.line2,
              city: customerInfo.billingAddress.city,
              state: customerInfo.billingAddress.state,
              postal_code: customerInfo.billingAddress.postal_code,
              country: customerInfo.billingAddress.country,
            },
            shipping: {
              name: `${customerInfo.firstName} ${customerInfo.lastName}`,
              phone: customerInfo.phone,
              address: {
                line1: customerInfo.shippingAddress.line1,
                line2: customerInfo.shippingAddress.line2,
                city: customerInfo.shippingAddress.city,
                state: customerInfo.shippingAddress.state,
                postal_code: customerInfo.shippingAddress.postal_code,
                country: customerInfo.shippingAddress.country,
              },
            },
          });
        }
      } catch (customerError) {
        console.log('Customer creation failed, proceeding without customer record');
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        customer: customer?.id,
        description: `PartsFinda order for ${items.length} items`,
        metadata: {
          customerEmail: customerInfo.email,
          customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
          itemCount: items.length.toString(),
          orderSource: 'partsfinda_checkout',
          ...metadata
        },
        shipping: customer ? undefined : {
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          phone: customerInfo.phone,
          address: {
            line1: customerInfo.shippingAddress.line1,
            line2: customerInfo.shippingAddress.line2,
            city: customerInfo.shippingAddress.city,
            state: customerInfo.shippingAddress.state,
            postal_code: customerInfo.shippingAddress.postal_code,
            country: customerInfo.shippingAddress.country,
          },
        },
        automatic_payment_methods: {
          enabled: true,
        },
        receipt_email: customerInfo.email,
      });

      console.log(`💳 Payment intent created: ${paymentIntent.id} for $${(amount/100).toFixed(2)}`);

      return NextResponse.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      });

    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);

      // Handle specific Stripe errors
      if (stripeError.type === 'StripeCardError') {
        return NextResponse.json(
          { error: stripeError.message },
          { status: 400 }
        );
      }

      if (stripeError.type === 'StripeRateLimitError') {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }

      if (stripeError.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          { error: 'Invalid payment request. Please check your information.' },
          { status: 400 }
        );
      }

      if (stripeError.type === 'StripeAPIError') {
        return NextResponse.json(
          { error: 'Payment service temporarily unavailable. Please try again.' },
          { status: 503 }
        );
      }

      if (stripeError.type === 'StripeConnectionError') {
        return NextResponse.json(
          { error: 'Network error. Please check your connection.' },
          { status: 502 }
        );
      }

      if (stripeError.type === 'StripeAuthenticationError') {
        return NextResponse.json(
          { error: 'Payment authentication failed. Please contact support.' },
          { status: 500 }
        );
      }

      throw stripeError;
    }

  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

// Retrieve payment intent status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    if (process.env.STRIPE_SECRET_KEY === 'sk_test_mock_key') {
      // Mock payment intent retrieval
      if (paymentIntentId.startsWith('pi_mock_')) {
        return NextResponse.json({
          success: true,
          paymentIntent: {
            id: paymentIntentId,
            status: 'succeeded',
            amount: 10718, // Mock amount
            currency: 'usd',
            created: Math.floor(Date.now() / 1000),
            description: 'PartsFinda order'
          }
        });
      } else {
        return NextResponse.json(
          { error: 'Payment intent not found' },
          { status: 404 }
        );
      }
    }

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return NextResponse.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          created: paymentIntent.created,
          description: paymentIntent.description,
          metadata: paymentIntent.metadata
        }
      });

    } catch (stripeError: any) {
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json(
          { error: 'Payment intent not found' },
          { status: 404 }
        );
      }

      throw stripeError;
    }

  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment intent' },
      { status: 500 }
    );
  }
}

// Update payment intent
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, amount, metadata } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    if (process.env.STRIPE_SECRET_KEY === 'sk_test_mock_key') {
      // Mock payment intent update
      return NextResponse.json({
        success: true,
        message: 'Payment intent updated (mock)',
        paymentIntentId
      });
    }

    try {
      const updateData: any = {};

      if (amount) {
        updateData.amount = amount;
      }

      if (metadata) {
        updateData.metadata = metadata;
      }

      const paymentIntent = await stripe.paymentIntents.update(paymentIntentId, updateData);

      return NextResponse.json({
        success: true,
        message: 'Payment intent updated successfully',
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      });

    } catch (stripeError: any) {
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json(
          { error: 'Payment intent not found' },
          { status: 404 }
        );
      }

      throw stripeError;
    }

  } catch (error) {
    console.error('Error updating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to update payment intent' },
      { status: 500 }
    );
  }
}
