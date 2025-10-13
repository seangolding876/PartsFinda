import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    
    const { planId, paymentMethod } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Get plan details
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE plan_id = $1',
      [planId]
    );

    if (planResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const plan = planResult.rows[0];

    // Check if user already has active subscription
    const existingSubResult = await query(
      'SELECT id FROM supplier_subscription WHERE user_id = $1 AND is_active = true',
      [userInfo.userId]
    );

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Create payment record
    const paymentResult = await query(
      `INSERT INTO payment_records (
        user_id, amount, currency, payment_method, status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, transaction_id`,
      [
        userInfo.userId,
        plan.price,
        'USD',
        paymentMethod || 'stripe',
        'pending'
      ]
    );

    const paymentRecord = paymentResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        paymentId: paymentRecord.id,
        amount: plan.price,
        currency: 'USD',
        plan: {
          id: plan.plan_id,
          name: plan.plan_name,
          duration_days: plan.duration_days
        },
        clientSecret: null // You'll integrate with Stripe here
      }
    });

  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create payment',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}