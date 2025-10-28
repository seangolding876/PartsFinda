export const dynamic = 'force-dynamic'; // Add this line
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
        p.*,
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
        sp.plan_name,
        sp.price as plan_price,
        sp.duration_days,
        ss.start_date as subscription_start,
        ss.end_date as subscription_end,
        ss.is_active as subscription_active
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN subscription_plans sp ON p.subscription_plan_id = sp.plan_id
      LEFT JOIN supplier_subscription ss ON p.user_id = ss.user_id AND ss.is_active = true
      WHERE p.payment_id = $1 OR p.stripe_payment_id = $1
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