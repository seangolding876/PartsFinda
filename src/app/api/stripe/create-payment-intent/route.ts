import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    const { planId } = await request.json();

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
    const amount = Math.round(plan.price * 100); // Convert to cents

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      metadata: {
        plan_id: planId.toString(),
        user_id: userInfo.userId.toString(),
        plan_name: plan.plan_name
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Save payment record in database
    await query(
      `INSERT INTO payments (
        user_id, stripe_payment_id, amount, currency, status, description, subscription_plan_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userInfo.userId,
        paymentIntent.id,
        plan.price,
        'USD',
        'pending',
        `Subscription: ${plan.plan_name}`,
        planId
      ]
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: plan.price,
      planName: plan.plan_name
    });

  } catch (error: any) {
    console.error('Stripe payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}