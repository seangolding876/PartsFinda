import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    
    const userCheck = await query(
      'SELECT role FROM users WHERE id = $1',
      [userInfo.userId]
    );
    
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const suppliersResult = await query(`
      SELECT 
        u.id,
        u.business_name,
        u.name as owner_name,
        u.email,
        u.location,
        u.membership_plan,
        u.created_at as date_joined,
        u.estimated_revenue,
        u.last_active,
        COUNT(DISTINCT rq.id) as total_quotes,
        AVG(pr.rating) as avg_rating,
        COUNT(pr.id) as total_reviews
      FROM users u
      LEFT JOIN request_quotes rq ON u.id = rq.seller_id
      LEFT JOIN seller_reviews pr ON u.id = pr.seller_id
      WHERE u.role = 'seller' AND u.verified_seller = true
      GROUP BY u.id, u.business_name, u.name, u.email, u.location, u.membership_plan, u.created_at, u.estimated_revenue, u.last_active
      ORDER BY u.created_at DESC
    `);

    const suppliers = suppliersResult.rows.map(supplier => ({
      id: supplier.id,
      businessName: supplier.business_name,
      ownerName: supplier.owner_name,
      email: supplier.email,
      location: supplier.location,
      membershipPlan: supplier.membership_plan,
      dateJoined: supplier.date_joined,
      rating: supplier.avg_rating ? parseFloat(supplier.avg_rating).toFixed(1) : '0.0',
      reviews: parseInt(supplier.total_reviews) || 0,
      revenue: supplier.estimated_revenue ? `J$${supplier.estimated_revenue}/month` : 'Not specified',
      status: 'active',
      lastActive: supplier.last_active || 'Unknown',
      totalQuotes: parseInt(supplier.total_quotes) || 0
    }));

    return NextResponse.json({
      success: true,
      data: suppliers
    });

  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}