import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// ✅ Add this export to make the route dynamic
export const dynamic = 'force-dynamic';
// ✅ Alternatively, you can use:
// export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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
    let userInfo;
    
    try {
      userInfo = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Get current subscription
    const subscriptionResult = await query(
      `SELECT 
        ss.*,
        sp.price,
        sp.duration_days,
        sp.request_delay_hours
      FROM supplier_subscription ss
      LEFT JOIN subscription_plans sp ON ss.plan_name = sp.plan_name
      WHERE ss.user_id = $1 AND ss.is_active = true
      ORDER BY ss.created_at DESC
      LIMIT 1`,
      [userInfo.userId]
    );

    const currentSubscription = subscriptionResult.rows[0] || null;

    return NextResponse.json({
      success: true,
      data: currentSubscription
    });

  } catch (error: any) {
    console.error('Error fetching current subscription:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch subscription data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}