import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

async function validateCoupon(couponCode) {
  try {
    const coupon = await stripe.coupons.retrieve(couponCode);
    return { valid: true, coupon };
  } catch (error) {
    console.log('❌ Coupon not found:', couponCode);
    return { valid: false, error: error.message };
  }
}


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

    // ✅ Validate coupon if provided
    let validCoupon = null;
    if (couponCode) {
      try {
        validCoupon = await stripe.coupons.retrieve(couponCode);
        console.log('✅ Coupon found:', validCoupon.id);
      } catch (error) {
        console.log('❌ Invalid coupon:', couponCode);
        return NextResponse.json(
          { error: `Invalid coupon code: ${couponCode}` }, 
          { status: 400 }
        );
      }
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
        plan_name: plan.plan_name,
        ...(couponCode && { coupon_applied: couponCode })
      },
      success_url: `${process.env.NEXTAUTH_URL}/seller/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/seller/subscription`,
      subscription_data: {
        metadata: {
          plan_id: planId.toString(),
          user_id: userInfo.userId.toString(),
          plan_name: plan.plan_name,
          ...(couponCode && { coupon_applied: couponCode })
        }
      }
    };

    // ✅ Apply coupon only if valid
    if (couponCode && validCoupon) {
      sessionConfig.discounts = [{
        coupon: couponCode
      }];
      console.log('🎫 Coupon applied to session:', couponCode);
    }

    // ✅ Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Stripe checkout session created:', session.id);

    // Save session info in database
    await query(
      `INSERT INTO stripe_sessions (
        user_id, session_id, plan_id, status, amount_total, coupon_code
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userInfo.userId,
        session.id,
        planId,
        'pending',
        session.amount_total ? session.amount_total / 100 : plan.price,
        couponCode || null
      ]
    );

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      couponApplied: !!couponCode
    });

  } catch (error: any) {
    console.error('❌ Stripe checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session: ' + error.message },
      { status: 500 }
    );
  }
}