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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let queryStr = `
      SELECT 
        sa.*,
        u.name as owner_name,
        u.email,
        u.phone,
        u.business_name,
        u.business_type,
        u.location,
        u.specializations,
        u.years_in_business,
        u.membership_plan,
        u.created_at as date_submitted,
        u.estimated_revenue
      FROM supplier_applications sa
      JOIN users u ON sa.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (status && status !== 'all') {
      paramCount++;
      queryStr += ` AND sa.status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      queryStr += ` AND (u.business_name ILIKE $${paramCount} OR u.name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    queryStr += ` ORDER BY 
      CASE WHEN sa.urgency = 'urgent' THEN 1 ELSE 2 END,
      sa.created_at DESC`;

    const applicationsResult = await query(queryStr, params);

    const applications = applicationsResult.rows.map(app => ({
      id: app.id,
      businessName: app.business_name,
      ownerName: app.owner_name,
      email: app.email,
      phone: app.phone,
      location: app.location,
      businessType: app.business_type,
      yearsInBusiness: app.years_in_business,
      specializations: app.specializations || [],
      membershipPlan: app.membership_plan,
      dateSubmitted: app.date_submitted,
      documentsUploaded: app.documents_uploaded || [],
      status: app.status,
      urgency: app.urgency,
      revenue: app.estimated_revenue ? `J$${app.estimated_revenue}/month` : 'Not specified'
    }));

    return NextResponse.json({
      success: true,
      data: applications
    });

  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}