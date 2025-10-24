// app/api/admin/payments/expiring/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const expiringQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.business_name,
        ss.plan_name,
        ss.end_date,
        DATE_PART('day', ss.end_date - CURRENT_DATE) as days_remaining
      FROM supplier_subscription ss
      JOIN users u ON ss.user_id = u.id
      WHERE ss.is_active = true 
        AND ss.end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      ORDER BY ss.end_date ASC
    `;

    const result = await query(expiringQuery);
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    console.error('Expiring subscriptions error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}