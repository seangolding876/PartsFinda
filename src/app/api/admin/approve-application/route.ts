// app/api/admin/approve-application/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // ✅ 1. Verify Authorization Header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    // ✅ 2. Decode and Verify JWT
    let userInfo;
    try {
      const token = authHeader.replace('Bearer ', '');
      userInfo = verifyToken(token);
    } catch (err: any) {
      console.error('JWT verification failed:', err);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // ✅ 3. Check Admin Role
    const userCheck = await query('SELECT role FROM users WHERE id = $1', [userInfo.userId]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Admin privileges required' },
        { status: 403 }
      );
    }

    // ✅ 4. Validate Request Body
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const { applicationId, action, reason } = body;
    if (!applicationId || !action) {
      return NextResponse.json(
        { success: false, error: 'Application ID and action are required' },
        { status: 400 }
      );
    }

    // ✅ 5. Check Application Existence
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

    // ✅ 6. Perform Action (Approve or Reject)
    if (action === 'approve') {
      await query(
        `UPDATE users SET verified_status = 'verified' WHERE id = $1`,
        [applicationId]
      );
      // Optionally send email
      // await sendApprovalEmail(application.email, application.name);
    } else if (action === 'reject') {
      if (!reason?.trim()) {
        return NextResponse.json(
          { success: false, error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      await query(
        `UPDATE users SET verified_status = 'rejected', rejection_reason = $2 WHERE id = $1`,
        [applicationId, reason]
      );
      // await sendRejectionEmail(application.email, application.name, reason);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // ✅ 7. Success Response
    return NextResponse.json({
      success: true,
      message: `Application ${action}ed successfully`
    });

  } catch (error: any) {
    // ✅ 8. Global Error Handling
    console.error('Unhandled error in approve-application route:', error);

    // Include stack trace only in development for debugging
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process application',
        ...(isDev && { details: error.message, stack: error.stack }),
      },
      { status: 500 }
    );
  }
}
