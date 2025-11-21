export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Query parameters se paymentId lein
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    // Validation
    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

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

    const result = await query(paymentQuery, [paymentId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    const payment = result.rows[0];

    // Safe data extraction with fallbacks
    const receiptData = {
      invoice_number: payment.invoice_number || `INV-${payment.payment_id}`,
      date: payment.created_at,
      customer: {
        name: payment.user_name || payment.customer_name || 'N/A',
        email: payment.user_email || payment.customer_email || 'N/A',
        business: payment.business_name || 'N/A',
        address: payment.address || 'N/A',
        city: payment.city || 'N/A',
        parish: payment.parish || 'N/A',
        postal_code: payment.postal_code || 'N/A',
        phone: payment.phone || 'N/A'
      },
      payment: {
        id: payment.stripe_payment_id || payment.payment_id,
        amount: payment.amount || 0,
        currency: payment.currency || 'USD',
        status: payment.status || 'unknown',
        method: payment.payment_method || 'N/A',
        description: payment.description || 'Subscription Payment'
      },
      subscription: {
        plan_name: payment.plan_name || 'N/A',
        price: payment.plan_price || 0,
        duration_days: payment.duration_days || 0
      },
      breakdown: {
        subtotal: payment.subtotal || payment.amount || 0,
        tax: payment.tax_amount || 0,
        total: payment.amount || 0
      }
    };

    const receiptUrl = `/admin/payments/receipt/${payment.payment_id || payment.id}`;

    return NextResponse.json({
      success: true,
      data: {
        receipt: receiptData,
        receipt_url: receiptUrl,
        download_url: `/api/admin/payments/receipt/${payment.payment_id || payment.id}/download`
      }
    });

  } catch (error: any) {
    console.error('Receipt generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}