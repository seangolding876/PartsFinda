import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { sendMail } from '@/lib/mailService';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { applicationId, action, reason } = body;

    if (!applicationId || !action) {
      return NextResponse.json(
        { success: false, error: 'Application ID and action are required' },
        { status: 400 }
      );
    }

    // Start transaction
    await query('BEGIN');

    try {
      // Get application details
      const applicationResult = await query(
        `SELECT sa.*, u.email, u.business_name, u.name as owner_name
         FROM supplier_applications sa
         JOIN users u ON sa.user_id = u.id
         WHERE sa.id = $1`,
        [applicationId]
      );

      if (applicationResult.rows.length === 0) {
        await query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Application not found' },
          { status: 404 }
        );
      }

      const application = applicationResult.rows[0];

      if (action === 'approve') {
        // Update application status
        await query(
          'UPDATE supplier_applications SET status = $1, reviewed_at = NOW() WHERE id = $2',
          ['approved', applicationId]
        );

        // Update user role to verified seller
        await query(
          'UPDATE users SET role = $1, verified_seller = true WHERE id = $2',
          ['seller', application.user_id]
        );

        // Send approval email
        await sendMail({
          to: application.email,
          subject: 'Your Supplier Application Has Been Approved - PartsFinda',
          html: `
            <h2>Congratulations! Your application has been approved.</h2>
            <p>Dear ${application.owner_name},</p>
            <p>We are pleased to inform you that your supplier application for <strong>${application.business_name}</strong> has been approved.</p>
            <p>You can now access your supplier dashboard and start receiving part requests.</p>
            <a href="${process.env.NEXTAUTH_URL}/seller/dashboard" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
              Access Your Dashboard
            </a>
          `
        });

        await query('COMMIT');

        return NextResponse.json({
          success: true,
          message: 'Application approved successfully'
        });

      } else if (action === 'reject') {
        if (!reason) {
          await query('ROLLBACK');
          return NextResponse.json(
            { success: false, error: 'Rejection reason is required' },
            { status: 400 }
          );
        }

        // Update application status
        await query(
          'UPDATE supplier_applications SET status = $1, rejection_reason = $2, reviewed_at = NOW() WHERE id = $3',
          ['rejected', reason, applicationId]
        );

        // Send rejection email
        await sendMail({
          to: application.email,
          subject: 'Update on Your Supplier Application - PartsFinda',
          html: `
            <h2>Update on Your Supplier Application</h2>
            <p>Dear ${application.owner_name},</p>
            <p>Thank you for your interest in becoming a supplier on PartsFinda.</p>
            <p>After careful review, we regret to inform you that your application for <strong>${application.business_name}</strong> could not be approved at this time.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>You may reapply after addressing the concerns mentioned above.</p>
          `
        });

        await query('COMMIT');

        return NextResponse.json({
          success: true,
          message: 'Application rejected successfully'
        });
      } else {
        await query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
      }

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('Error processing application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process application' },
      { status: 500 }
    );
  }
}