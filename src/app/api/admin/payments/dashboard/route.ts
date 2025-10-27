// app/api/admin/payments/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get dashboard summary
    const summaryQuery = `
      SELECT 
        -- Total revenue
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue,
        
        -- Today's revenue
        (SELECT COALESCE(SUM(amount), 0) FROM payments 
         WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE) as today_revenue,
        
        -- Monthly revenue
        (SELECT COALESCE(SUM(amount), 0) FROM payments 
         WHERE status = 'completed' AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)) as monthly_revenue,
        
        -- Total users
        (SELECT COUNT(*) FROM users) as total_users,
        
        -- Active subscribers
        (SELECT COUNT(*) FROM supplier_subscription WHERE is_active = true) as active_subscribers,
        
        -- Pending payments
        (SELECT COUNT(*) FROM payments WHERE status = 'pending') as pending_payments,
        
        -- Users with 7 days left in subscription
        (SELECT COUNT(*) FROM supplier_subscription 
         WHERE is_active = true AND end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days') as expiring_soon
    `;

    const summaryResult = await query(summaryQuery);
    
    return NextResponse.json({
      success: true,
      data: summaryResult.rows[0]
    });

  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}