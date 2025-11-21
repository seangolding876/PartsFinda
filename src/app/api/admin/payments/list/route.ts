// app/api/admin/payments/list/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;

    let whereConditions = ['1=1'];
    let queryParams = [];

    if (status && status !== 'all') {
      whereConditions.push(`sp.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    if (search) {
      whereConditions.push(`(
        u.name ILIKE $${queryParams.length + 1} OR 
        u.email ILIKE $${queryParams.length + 1} OR 
        u.business_name ILIKE $${queryParams.length + 1} OR
        sp.stripe_payment_intent_id ILIKE $${queryParams.length + 1} OR
        sp.stripe_subscription_id ILIKE $${queryParams.length + 1}
      )`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Total count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM subscription_payments sp
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE ${whereClause}
    `;

    // Main data query
    const dataQuery = `
      SELECT 
        sp.id as payment_id,
        sp.stripe_payment_intent_id,
        sp.stripe_subscription_id,
        sp.amount,
        sp.currency,
        sp.status,
        sp.payment_method,
        sp.created_at,
        sp.billing_cycle_start,
        sp.billing_cycle_end,
        sp.invoice_number,
        sp.receipt_url,
        sp.customer_email,
        sp.customer_name,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.business_name,
        spl.plan_name as subscription_plan,
        ss.start_date,
        ss.end_date,
        ss.is_active as subscription_active
      FROM subscription_payments sp
      LEFT JOIN users u ON sp.user_id = u.id
      LEFT JOIN subscription_plans spl ON sp.subscription_plan_id = spl.plan_id
      LEFT JOIN supplier_subscription ss ON sp.user_id = ss.user_id AND ss.is_active = true
      WHERE ${whereClause}
      ORDER BY sp.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const countParams = [...queryParams];
    queryParams.push(limit, offset);

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, countParams),
      query(dataQuery, queryParams)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        payments: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });

  } catch (error: any) {
    console.error('Payments list error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}