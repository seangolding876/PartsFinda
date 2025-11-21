export const dynamic = 'force-dynamic'; // Add this line
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { id, email } = await request.json();

    // Payment details get karen
    const paymentQuery = `
      SELECT 
        p.*,
        u.*,
        sp.plan_name,
        sp.price as plan_price,
        sp.duration_days
      FROM subscription_payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN subscription_plans sp ON p.subscription_plan_id = sp.plan_id
      WHERE p.id = $1 
    `;


   // OR p.stripe_payment_id = $1
    const result = await query(paymentQuery, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    const payment = result.rows[0];

    // Yahan aap email service integrate kar sakte hain
    // For now, hum receipt data return karenge

    const receiptData = {
      invoice_number: payment.invoice_number || `INV-${payment.id}`,
      date: payment.created_at,
      customer: {
        name: payment.user_name || payment.customer_name,
        email: payment.user_email || payment.customer_email,
        business: payment.business_name,
        address: payment.address,
        city: payment.city,
        parish: payment.parish,
        postal_code: payment.postal_code,
        phone: payment.phone
      },
      payment: {
        id: payment.stripe_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.payment_method,
        description: payment.description
      },
      subscription: {
        plan_name: payment.plan_name,
        price: payment.plan_price,
        duration_days: payment.duration_days
      },
      breakdown: {
        subtotal: payment.subtotal || payment.amount,
        tax: payment.tax_amount || 0,
        total: payment.amount
      }
    };

    // Generate receipt URL (temporary)
    const receiptUrl = `/admin/payments/receipt/${payment.id}`;

    return NextResponse.json({
      success: true,
      data: {
        receipt: receiptData,
        receipt_url: receiptUrl,
        download_url: `/api/admin/payments/receipt/${payment.id}/download`
      }
    });

  } catch (error: any) {
    console.error('Receipt generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}