import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    
    // Verify user is admin
    const userCheck = await query(
      'SELECT role FROM users WHERE id = $1',
      [userInfo.userId]
    );
    
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // Get real stats from database using users table and payments table
    const [
      totalSuppliersResult,
      verifiedSuppliersResult,
      pendingVerificationResult,
      activeRequestsResult,
      revenueResult,
      urgentSuppliersResult,
      growthStatsResult
    ] = await Promise.all([
      // Total suppliers
      query(`SELECT COUNT(*) as count FROM users WHERE role = 'seller' AND email_verified = true`),
      
      // Verified suppliers (all 3 documents uploaded)
      query(`SELECT COUNT(*) as count FROM users WHERE role = 'seller' AND 
             business_license IS NOT NULL AND business_license != '' AND
             tax_certificate IS NOT NULL AND tax_certificate != '' AND
             insurance_certificate IS NOT NULL AND insurance_certificate != ''`),
      
      // Pending verification (missing documents)
      query(`SELECT COUNT(*) as count FROM users WHERE role = 'seller' AND 
             (business_license IS NULL OR business_license = '' OR
              tax_certificate IS NULL OR tax_certificate = '' OR
              insurance_certificate IS NULL OR insurance_certificate = '')`),
      
      // Active requests
      query(`SELECT COUNT(*) as count FROM part_requests WHERE status = 'open' AND expires_at > NOW()`),
      
      // Monthly revenue from payments table
      query(`SELECT COALESCE(SUM(amount), 0) as revenue FROM payments 
             WHERE status = 'completed' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`),
      
      // Urgent suppliers (missing documents but registered)
      query(`SELECT COUNT(*) as count FROM users WHERE role = 'seller' AND 
             (business_license IS NULL OR business_license = '' OR
              tax_certificate IS NULL OR tax_certificate = '' OR
              insurance_certificate IS NULL OR insurance_certificate = '')`),
      
      // New suppliers this month
      query(`SELECT COUNT(*) as new_suppliers FROM users WHERE role = 'seller' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`)
    ]);

    const stats = {
      totalSuppliers: parseInt(totalSuppliersResult.rows[0]?.count) || 0,
      verifiedSuppliers: parseInt(verifiedSuppliersResult.rows[0]?.count) || 0,
      pendingVerification: parseInt(pendingVerificationResult.rows[0]?.count) || 0,
      activeRequests: parseInt(activeRequestsResult.rows[0]?.count) || 0,
      monthlyRevenue: parseInt(revenueResult.rows[0]?.revenue) || 0,
      urgentApplications: parseInt(urgentSuppliersResult.rows[0]?.count) || 0,
      newSuppliersThisMonth: parseInt(growthStatsResult.rows[0]?.new_suppliers) || 0
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}