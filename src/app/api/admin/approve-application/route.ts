// app/api/admin/approve-application/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
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

    const body = await request.json();
    const { applicationId, action, reason } = body;

    if (!applicationId || !action) {
      return NextResponse.json(
        { success: false, error: 'Application ID and action are required' },
        { status: 400 }
      );
    }

    // Get application details
    const applicationResult = await query(
      `SELECT * FROM users WHERE id = $1 AND role = 'seller'`,
      [applicationId]
    );

    if (applicationResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    const application = applicationResult.rows[0];

    if (action === 'approve') {
      // Update user status to approved and activate account
      await query(
        `UPDATE users SET 
          status = 'approved',
          email_verified = true,
          verified_seller = true,
          verified_status = 'verified'
         WHERE id = $1`,
        [applicationId]
      );

      // Send approval email (you can implement this)
      // await sendApprovalEmail(application.email, application.name);

    } else if (action === 'reject') {
      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      // Update user status to rejected
      await query(
        `UPDATE users SET 
          status = 'rejected',
          rejection_reason = $1
         WHERE id = $2`,
        [reason, applicationId]
      );

      // Send rejection email (you can implement this)
      // await sendRejectionEmail(application.email, application.name, reason);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Application ${action}ed successfully`
    });

  } catch (error: any) {
    console.error('Error processing application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process application' },
      { status: 500 }
    );
  }
}