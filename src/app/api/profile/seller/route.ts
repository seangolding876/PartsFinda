import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    // Get seller profile with subscription data
    const sellerResult = await query(
      `SELECT 
        u.name,
        u.email,
        u.avg_rating,
        u.total_ratings,
        COALESCE(u.membership_plan, 'Basic') as plan_name,
        ss.start_date,
        ss.end_date,
        ss.is_active,
        CASE 
          WHEN ss.end_date IS NULL THEN 'no_subscription'
          WHEN ss.end_date > NOW() THEN 'active'
          ELSE 'expired'
        END as subscription_status
       FROM users u
       LEFT JOIN supplier_subscription ss ON u.id = ss.user_id
       WHERE u.id = $1 AND u.role = 'seller'
       ORDER BY ss.created_at DESC 
       LIMIT 1`,
      [userInfo.userId]
    );

    if (sellerResult.rows.length > 0) {
      const seller = sellerResult.rows[0];
      
      return NextResponse.json({
        success: true,
        data: {
          name: seller.name || 'Your Business',
          email: seller.email,
          rating: seller.avg_rating || 4.8,
          reviews: seller.total_ratings || 0,
          subscription: {
            plan_name: seller.plan_name,
            start_date: seller.start_date,
            end_date: seller.end_date,
            is_active: seller.is_active,
            status: seller.subscription_status
          }
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Seller not found' },
        { status: 404 }
      );
    }

  } catch (error: any) {
    console.error('Seller profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch seller profile' },
      { status: 500 }
    );
  }
}