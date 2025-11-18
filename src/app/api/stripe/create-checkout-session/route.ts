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

    // ✅ Stripe Price IDs - Yeh aapke Stripe dashboard se lena hai
    const stripePriceIds: { [key: string]: string } = {
      'premium': 'prod_TRhq6NZ0CcnPLP', // Replace with actual price ID
      'enterprise': 'prod_TRhqBgCsy1Jhsi', // Replace with actual price ID
      'basic': 'price_1NxxxBasic', // Replace with actual price ID
      'standard': 'price_1NxxxStandard' // Replace with actual price ID
    };

    const priceId = stripePriceIds[plan.plan_name.toLowerCase()];
    
    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price not configured for this plan' }, { status: 400 });
    }

    // ✅ Stripe Checkout Session Configuration
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
        plan_name: plan.plan_name
      },
      success_url: `${process.env.NEXTAUTH_URL}/seller/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/seller/subscription`,
      subscription_data: {
        metadata: {
          plan_id: planId.toString(),
          user_id: userInfo.userId.toString(),
          plan_name: plan.plan_name
        }
      }
    };

    // ✅ Apply coupon if provided
    if (couponCode) {
      sessionConfig.discounts = [{
        coupon: couponCode // coupon_XXXXXXXX format
      }];
    }

    // ✅ Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Stripe checkout session created:', session.id);

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
      url: session.url
    });

  } catch (error: any) {
    console.error('❌ Stripe checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session: ' + error.message },
      { status: 500 }
    );
  }
}