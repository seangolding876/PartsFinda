// app/api/admin/payments/[paymentId]/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const paymentId = params.paymentId;

    const paymentQuery = `
      SELECT 
        sp.*,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.business_name,
        u.phone,
        u.address,
        u.city,
        u.parish,
        u.postal_code,
        u.business_phone,
        u.business_email,
        u.business_registration_number,
        u.tax_id,
        spl.plan_name,
        spl.price as plan_price,
        spl.duration_days,
        ss.start_date as subscription_start,
        ss.end_date as subscription_end,
        ss.is_active as subscription_active
      FROM subscription_payments sp
      LEFT JOIN users u ON sp.user_id = u.id
      LEFT JOIN subscription_plans spl ON sp.subscription_plan_id = spl.plan_id
      LEFT JOIN supplier_subscription ss ON sp.user_id = ss.user_id AND ss.is_active = true
      WHERE sp.id = $1 OR sp.stripe_payment_intent_id = $1 OR sp.stripe_subscription_id = $1
    `;

    const result = await query(paymentQuery, [paymentId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('Payment detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}