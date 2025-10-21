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
        id,
        business_name as "businessName",
        name as "ownerName",
        email,
        phone,
        location,
        business_type as "businessType",
        years_in_business as "yearsInBusiness",
        specializations,
        membership_plan as "membershipPlan",
        created_at as "dateSubmitted",
        business_license as "businessLicense",
        tax_certificate as "taxCertificate",
        insurance_certificate as "insuranceCertificate",
        revenue,
        CASE 
          WHEN business_license IS NOT NULL AND business_license != '' AND
               tax_certificate IS NOT NULL AND tax_certificate != '' AND
               insurance_certificate IS NOT NULL AND insurance_certificate != ''
          THEN 'verified'
          ELSE 'pending_review'
        END as status,
        CASE 
          WHEN business_license IS NULL OR business_license = '' OR
               tax_certificate IS NULL OR tax_certificate = '' OR
               insurance_certificate IS NULL OR insurance_certificate = ''
          THEN 'urgent'
          ELSE 'normal'
        END as urgency
      FROM users 
      WHERE role = 'seller'
    `;

    const queryParams = [];

    // Status filter
    if (status && status !== 'all') {
      if (status === 'pending_review') {
        queryStr += ` AND (business_license IS NULL OR business_license = '' OR
                          tax_certificate IS NULL OR tax_certificate = '' OR
                          insurance_certificate IS NULL OR insurance_certificate = '')`;
      } else if (status === 'documents_review') {
        queryStr += ` AND business_license IS NOT NULL AND business_license != '' AND
                      tax_certificate IS NOT NULL AND tax_certificate != '' AND
                      insurance_certificate IS NOT NULL AND insurance_certificate != ''`;
      }
    }

    // Search filter
    if (search) {
      queryStr += ` AND (business_name ILIKE $1 OR name ILIKE $1 OR email ILIKE $1)`;
      queryParams.push(`%${search}%`);
    }

    queryStr += ` ORDER BY created_at DESC`;

    const applicationsResult = await query(queryStr, queryParams);

    const applications = applicationsResult.rows.map(app => ({
      ...app,
      documentsUploaded: [
        ...(app.businessLicense ? ['business_license'] : []),
        ...(app.taxCertificate ? ['tax_certificate'] : []),
        ...(app.insuranceCertificate ? ['insurance'] : [])
      ]
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