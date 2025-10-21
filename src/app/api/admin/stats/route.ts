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

    // Get real stats from database
    const [
      totalSuppliersResult,
      pendingApplicationsResult,
      activeRequestsResult,
      revenueResult,
      urgentApplicationsResult,
      growthStatsResult
    ] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM users WHERE role = 'seller' AND email_verified = true`),
      query(`SELECT COUNT(*) as count FROM supplier_applications WHERE status IN ('pending_review', 'documents_review', 'pending_documents')`),
      query(`SELECT COUNT(*) as count FROM part_requests WHERE status = 'open' AND expires_at > NOW()`),
      query(`SELECT COALESCE(SUM(amount), 0) as revenue FROM transactions WHERE status = 'completed' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`),
      query(`SELECT COUNT(*) as count FROM supplier_applications WHERE urgency = 'urgent' AND status IN ('pending_review', 'documents_review')`),
      query(`SELECT COUNT(*) as new_suppliers FROM users WHERE role = 'seller' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`)
    ]);

    const stats = {
      totalSuppliers: parseInt(totalSuppliersResult.rows[0]?.count) || 0,
      pendingApplications: parseInt(pendingApplicationsResult.rows[0]?.count) || 0,
      activeRequests: parseInt(activeRequestsResult.rows[0]?.count) || 0,
      monthlyRevenue: parseInt(revenueResult.rows[0]?.revenue) || 0,
      urgentApplications: parseInt(urgentApplicationsResult.rows[0]?.count) || 0,
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