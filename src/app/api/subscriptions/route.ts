import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

// Check if Stripe is properly configured
const isStripeConfigured = () => {
  return process.env.STRIPE_SECRET_KEY &&
         process.env.STRIPE_SECRET_KEY !== 'YOUR_STRIPE_SECRET_KEY_key' &&
         process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
         process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY !== 'YOUR_STRIPE_PUBLISHABLE_KEY';
};

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  partRequestLimit: number;
  supportLevel: string;
  stripeProductId?: string;
  stripePriceId?: string;
}

interface Seller {
  id: string;
  email: string;
  name: string;
  subscriptionTier: 'basic' | 'silver' | 'gold';
  subscriptionStatus: 'active' | 'inactive' | 'canceled' | 'past_due';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
  currentPeriodStart?: string;
}

// Subscription plans configuration
const subscriptionPlans: Record<string, SubscriptionPlan> = {
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    price: 29.99,
    interval: 'month',
    features: [
      'Up to 10 part request notifications per day',
      'Basic search visibility',
      'Email support',
      'Access to buyer contact information',
      'Basic analytics dashboard'
    ],
    partRequestLimit: 10,
    supportLevel: 'Email',
    stripeProductId: 'prod_basic',
    stripePriceId: 'price_basic_monthly'
  },
  silver: {
    id: 'silver',
    name: 'Silver Plan',
    price: 79.99,
    interval: 'month',
    features: [
      'Up to 25 part request notifications per day',
      'Enhanced search visibility',
      'Priority email support',
      'Advanced analytics dashboard',
      'Custom business profile',
      'Bulk part upload tools',
      'Customer review management'
    ],
    partRequestLimit: 25,
    supportLevel: 'Priority Email',
    stripeProductId: 'prod_silver',
    stripePriceId: 'price_silver_monthly'
  },
  gold: {
    id: 'gold',
    name: 'Gold Plan',
    price: 149.99,
    interval: 'month',
    features: [
      'Up to 50 part request notifications per day',
      'Maximum search visibility',
      'Phone & email support',
      'Advanced analytics & reporting',
      'Featured seller badge',
      'API access for inventory management',
      'Custom branding options',
      'Dedicated account manager',
      'Early access to new features'
    ],
    partRequestLimit: 50,
    supportLevel: 'Phone & Email',
    stripeProductId: 'prod_gold',
    stripePriceId: 'price_gold_monthly'
  }
};

// Mock seller database
let sellers: Seller[] = [
  {
    id: '1',
    email: 'seller1@example.com',
    name: 'AutoParts Pro',
    subscriptionTier: 'gold',
    subscriptionStatus: 'active',
    stripeCustomerId: 'cus_mock_customer_1',
    stripeSubscriptionId: 'sub_mock_subscription_1',
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    email: 'seller2@example.com',
    name: 'Budget Parts Supply',
    subscriptionTier: 'basic',
    subscriptionStatus: 'active',
    stripeCustomerId: 'cus_mock_customer_2',
    stripeSubscriptionId: 'sub_mock_subscription_2',
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Create or retrieve Stripe customer
async function getOrCreateCustomer(sellerId: string, email: string, name: string): Promise<string> {
  const seller = sellers.find(s => s.id === sellerId);

  if (seller?.stripeCustomerId) {
    return seller.stripeCustomerId;
  }

  try {
    if (process.env.STRIPE_SECRET_KEY === 'YOUR_STRIPE_SECRET_KEY_key') {
      // Mock customer creation
      const customerId = `cus_mock_${sellerId}_${Date.now()}`;

      // Update seller with customer ID
      const sellerIndex = sellers.findIndex(s => s.id === sellerId);
      if (sellerIndex >= 0) {
        sellers[sellerIndex].stripeCustomerId = customerId;
      }

      return customerId;
    }

    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        sellerId
      }
    });

    // Update seller with customer ID
    const sellerIndex = sellers.findIndex(s => s.id === sellerId);
    if (sellerIndex >= 0) {
      sellers[sellerIndex].stripeCustomerId = customer.id;
    }

    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create customer');
  }
}

// Get subscription plans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const action = searchParams.get('action');

    if (action === 'plans') {
      return NextResponse.json({
        success: true,
        plans: Object.values(subscriptionPlans)
      });
    }

    if (action === 'current' && sellerId) {
      const seller = sellers.find(s => s.id === sellerId);

      if (!seller) {
        return NextResponse.json(
          { error: 'Seller not found' },
          { status: 404 }
        );
      }

      const currentPlan = subscriptionPlans[seller.subscriptionTier];

      return NextResponse.json({
        success: true,
        subscription: {
          ...seller,
          plan: currentPlan,
          isActive: seller.subscriptionStatus === 'active',
          daysRemaining: seller.currentPeriodEnd ?
            Math.ceil((new Date(seller.currentPeriodEnd).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : 0
        }
      });
    }

    return NextResponse.json({
      success: true,
      plans: Object.values(subscriptionPlans)
    });

  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    );
  }
}

// Create or update subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sellerId, planId, sellerEmail, sellerName, action } = body;

    if (!sellerId || !sellerEmail || !sellerName) {
      return NextResponse.json(
        { error: 'Missing required fields: sellerId, sellerEmail, sellerName' },
        { status: 400 }
      );
    }

    if (action === 'create-checkout-session') {
      if (!planId || !subscriptionPlans[planId]) {
        return NextResponse.json(
          { error: 'Invalid plan ID' },
          { status: 400 }
        );
      }

      try {
        const customerId = await getOrCreateCustomer(sellerId, sellerEmail, sellerName);
        const plan = subscriptionPlans[planId];

        if (!isStripeConfigured()) {
          // Mock checkout session for development
          const mockSessionId = `cs_mock_${sellerId}_${planId}_${Date.now()}`;

          return NextResponse.json({
            success: true,
            sessionId: mockSessionId,
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id=${mockSessionId}&plan=${planId}&seller=${sellerId}`,
            message: 'Mock mode: Configure Stripe environment variables for real payment processing'
          });
        }

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [
            {
              price: plan.stripePriceId,
              quantity: 1,
            },
          ],
          success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/seller/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/seller/subscription?canceled=true`,
          metadata: {
            sellerId,
            planId
          },
          allow_promotion_codes: true,
          billing_address_collection: 'required',
        });

        return NextResponse.json({
          success: true,
          sessionId: session.id,
          url: session.url
        });

      } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json(
          { error: 'Failed to create checkout session' },
          { status: 500 }
        );
      }
    }

    if (action === 'update-plan') {
      const { newPlanId } = body;

      if (!newPlanId || !subscriptionPlans[newPlanId]) {
        return NextResponse.json(
          { error: 'Invalid new plan ID' },
          { status: 400 }
        );
      }

      const sellerIndex = sellers.findIndex(s => s.id === sellerId);
      if (sellerIndex === -1) {
        return NextResponse.json(
          { error: 'Seller not found' },
          { status: 404 }
        );
      }

      try {
        if (!isStripeConfigured()) {
          // Mock subscription update
          sellers[sellerIndex].subscriptionTier = newPlanId as 'basic' | 'silver' | 'gold';
          sellers[sellerIndex].subscriptionStatus = 'active';

          return NextResponse.json({
            success: true,
            message: 'Subscription updated successfully (Mock mode)',
            subscription: sellers[sellerIndex]
          });
        }

        const seller = sellers[sellerIndex];

        if (!seller.stripeSubscriptionId) {
          throw new Error('No active subscription found');
        }

        // Get current subscription
        const subscription = await stripe.subscriptions.retrieve(seller.stripeSubscriptionId);

        // Update subscription
        const updatedSubscription = await stripe.subscriptions.update(seller.stripeSubscriptionId, {
          items: [{
            id: subscription.items.data[0].id,
            price: subscriptionPlans[newPlanId].stripePriceId,
          }],
          proration_behavior: 'create_prorations',
        });

        // Update seller in database
        sellers[sellerIndex].subscriptionTier = newPlanId as 'basic' | 'silver' | 'gold';
        sellers[sellerIndex].subscriptionStatus = updatedSubscription.status as any;

        return NextResponse.json({
          success: true,
          message: 'Subscription updated successfully',
          subscription: sellers[sellerIndex]
        });

      } catch (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing subscription request:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription request' },
      { status: 500 }
    );
  }
}

// Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    if (!sellerId) {
      return NextResponse.json(
        { error: 'Seller ID is required' },
        { status: 400 }
      );
    }

    const sellerIndex = sellers.findIndex(s => s.id === sellerId);
    if (sellerIndex === -1) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    const seller = sellers[sellerIndex];

    try {
      if (!isStripeConfigured()) {
        // Mock subscription cancellation
        sellers[sellerIndex].subscriptionStatus = 'canceled';

        return NextResponse.json({
          success: true,
          message: 'Subscription canceled successfully (Mock mode)'
        });
      }

      if (!seller.stripeSubscriptionId) {
        return NextResponse.json(
          { error: 'No active subscription found' },
          { status: 400 }
        );
      }

      // Cancel subscription at period end
      await stripe.subscriptions.update(seller.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Update seller status
      sellers[sellerIndex].subscriptionStatus = 'canceled';

      return NextResponse.json({
        success: true,
        message: 'Subscription will be canceled at the end of the current billing period'
      });

    } catch (error) {
      console.error('Error canceling subscription:', error);
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing cancellation request:', error);
    return NextResponse.json(
      { error: 'Failed to process cancellation request' },
      { status: 500 }
    );
  }
}

// Webhook handler for Stripe events
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, sellerId } = body;

    // Handle webhook events
    if (type === 'webhook') {
      const event = data;

      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          const sessionSellerId = session.metadata?.sellerId;
          const planId = session.metadata?.planId;

          if (sessionSellerId && planId) {
            const sellerIndex = sellers.findIndex(s => s.id === sessionSellerId);
            if (sellerIndex >= 0) {
              sellers[sellerIndex].subscriptionTier = planId as 'basic' | 'silver' | 'gold';
              sellers[sellerIndex].subscriptionStatus = 'active';
              sellers[sellerIndex].stripeSubscriptionId = session.subscription;
            }
          }
          break;

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          // Handle subscription updates
          break;

        case 'invoice.payment_failed':
          // Handle failed payments
          break;
      }

      return NextResponse.json({ received: true });
    }

    return NextResponse.json(
      { error: 'Invalid webhook type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
