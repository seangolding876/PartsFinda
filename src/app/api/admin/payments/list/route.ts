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

    let whereConditions = [];
    let queryParams = [];

    if (status && status !== 'all') {
      whereConditions.push(`p.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    if (search) {
      whereConditions.push(`(
        u.name ILIKE $${queryParams.length + 1} OR 
        u.email ILIKE $${queryParams.length + 1} OR 
        u.business_name ILIKE $${queryParams.length + 1} OR
        p.stripe_payment_id ILIKE $${queryParams.length + 1} OR
        p.invoice_number ILIKE $${queryParams.length + 1}
      )`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Total count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
    `;

    // Main data query
    const dataQuery = `
      SELECT 
        p.payment_id,
        p.stripe_payment_id,
        p.amount,
        p.currency,
        p.status,
        p.description,
        p.created_at,
        p.receipt_url,
        p.customer_email,
        p.customer_name,
        p.invoice_number,
        p.payment_method,
        p.plan_details,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.business_name,
        u.phone,
        sp.plan_name as subscription_plan,
        ss.start_date,
        ss.end_date,
        ss.is_active as subscription_active
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN subscription_plans sp ON p.subscription_plan_id = sp.plan_id
      LEFT JOIN supplier_subscription ss ON p.user_id = ss.user_id AND ss.is_active = true
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(limit, offset);

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams.slice(0, -2)),
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