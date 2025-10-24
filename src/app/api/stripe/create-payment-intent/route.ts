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

    console.log('🔍 Received planId:', planId); // ✅ Debug log

    if (!planId) {
      console.log('❌ planId is missing or invalid');
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Get plan details
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE plan_id = $1',
      [planId]
    );

    console.log('🔍 Plan query result:', planResult.rows); // ✅ Debug log

    if (planResult.rows.length === 0) {
      console.log('❌ No plan found with ID:', planId);
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const plan = planResult.rows[0];
    const amount = Math.round(plan.price * 100); // Convert to cents

    console.log('🔍 Creating payment intent for plan:', {
      planId: planId,
      planName: plan.plan_name,
      amount: amount,
      userId: userInfo.userId
    });

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

    console.log('🔍 Stripe payment intent created:', paymentIntent.id);

    // ✅ CORRECTED: Save payment record with subscription_plan_id
    await query(
      `INSERT INTO payments (
        user_id, stripe_payment_id, amount, currency, status, description, subscription_plan_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userInfo.userId,
        paymentIntent.id,
        plan.price, // This should be the decimal amount, not the cents
        'USD',
        'pending',
        `Subscription: ${plan.plan_name}`,
        planId  // ✅ This should work now
      ]
    );

    console.log('✅ Payment record saved successfully');

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: plan.price,
      planName: plan.plan_name
    });

  } catch (error: any) {
    console.error('❌ Stripe payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent: ' + error.message },
      { status: 500 }
    );
  }
}