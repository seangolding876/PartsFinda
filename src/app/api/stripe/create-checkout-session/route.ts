import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    const { planId, couponCode } = await request.json();

    console.log('🔍 Received planId:', planId, 'couponCode:', couponCode);

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Get plan details
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE plan_id = $1',
      [planId]
    );

    if (planResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const plan = planResult.rows[0];
    
    // Get user details for Stripe customer
    const userResult = await query(
      'SELECT email, name FROM users WHERE id = $1',
      [userInfo.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // ✅ Check if user has existing active subscription
    const existingSubResult = await query(
      `SELECT ss.stripe_subscription_id, sp.plan_name, ss.end_date 
       FROM supplier_subscription ss
       JOIN subscription_plans sp ON ss.plan_name = sp.plan_name
       WHERE ss.user_id = $1 AND ss.is_active = true`,
      [userInfo.userId]
    );

    const hasActiveSubscription = existingSubResult.rows.length > 0;
    const existingSubscription = hasActiveSubscription ? existingSubResult.rows[0] : null;

    console.log('📊 Existing subscription check:', {
      hasActiveSubscription,
      currentPlan: existingSubscription?.plan_name,
      stripeSubscriptionId: existingSubscription?.stripe_subscription_id
    });

    // ✅ Stripe Price IDs
    const stripePriceIds: { [key: string]: string } = {
      'premium': 'price_1SUoQNAs2bHVxogZgEFlB38T',
      'enterprise': 'price_1SUoRIAs2bHVxogZYGOAg92m',
      'basic': 'price_1NxxxBasic',
      'standard': 'price_1NxxxStandard'
    };

    const priceId = stripePriceIds[plan.plan_name.toLowerCase()];
    
    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price not configured for this plan' }, { status: 400 });
    }

    // ✅ Stripe Checkout Session Configuration - FIXED
    const sessionConfig: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        plan_id: planId.toString(),
        user_id: userInfo.userId.toString(),
        plan_name: plan.plan_name,
        is_upgrade: hasActiveSubscription.toString()
      },
      success_url: `${process.env.NEXTAUTH_URL}/seller/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/seller/subscription`,
      subscription_data: {
        metadata: {
          plan_id: planId.toString(),
          user_id: userInfo.userId.toString(), 
          plan_name: plan.plan_name,
          is_upgrade: hasActiveSubscription.toString()
        },
        // ✅ FIX: Add proper billing_cycle_anchor with proration_behavior
        proration_behavior: 'create_prorations',
        billing_cycle_anchor: Math.floor(Date.now() / 1000) // ✅ Current timestamp in seconds
      },
      allow_promotion_codes: true
    };

    // ✅ OPTIONAL: Agar existing subscription hai toh uski information add karein
    if (hasActiveSubscription && existingSubscription.stripe_subscription_id) {
      sessionConfig.metadata.existing_subscription_id = existingSubscription.stripe_subscription_id;
      sessionConfig.subscription_data.metadata.existing_subscription_id = existingSubscription.stripe_subscription_id;
      
      console.log('🔄 Upgrade scenario detected:', {
        from: existingSubscription.plan_name,
        to: plan.plan_name,
        existingStripeId: existingSubscription.stripe_subscription_id
      });
    }

    // ✅ Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Stripe checkout session created:', session.id, {
      isUpgrade: hasActiveSubscription,
      prorationBehavior: 'create_prorations',
      billingCycleAnchor: Math.floor(Date.now() / 1000)
    });

    // Save session info in database
    await query(
      `INSERT INTO stripe_sessions (
        user_id, session_id, plan_id, status, amount_total
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        userInfo.userId,
        session.id,
        planId,
        'pending',
        session.amount_total ? session.amount_total / 100 : plan.price
      ]
    );

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      isUpgrade: hasActiveSubscription
    });

  } catch (error: any) {
    console.error('❌ Stripe checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session: ' + error.message },
      { status: 500 }
    );
  }
}