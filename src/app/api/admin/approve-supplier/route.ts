import { NextRequest, NextResponse } from 'next/server';

// Mock supplier applications database
const supplierApplications = [
  {
    id: 'SUP-001',
    businessName: 'Auto Excellence Ltd',
    ownerName: 'John Mitchell',
    email: 'john@autoexcellence.com',
    phone: '+876 555 0123',
    location: 'Half Way Tree, Kingston',
    businessType: 'Auto Parts Shop',
    status: 'pending_review',
    dateSubmitted: '2024-01-15T10:30:00Z'
  },
  {
    id: 'SUP-002',
    businessName: 'Caribbean Motors Supply',
    ownerName: 'Sarah Johnson',
    email: 'sarah@caribbeanmotors.com',
    phone: '+876 555 0456',
    location: 'Mandeville, Manchester',
    businessType: 'Parts Distributor',
    status: 'documents_review',
    dateSubmitted: '2024-01-14T14:20:00Z'
  },
  {
    id: 'SUP-003',
    businessName: 'Island Wide Auto',
    ownerName: 'David Williams',
    email: 'david@islandwide.com',
    phone: '+876 555 0789',
    location: 'Ocho Rios, St. Ann',
    businessType: 'Mechanic Shop',
    status: 'pending_documents',
    dateSubmitted: '2024-01-13T09:15:00Z'
  }
];

// Mock function to send email notifications
async function sendNotificationEmail(supplier: any, action: string, reason?: string) {
  try {
    console.log(`📧 Sending ${action} email to ${supplier.email}`);

    const emailContent = action === 'approve'
      ? {
          subject: '🎉 Your PartsFinda Supplier Application has been APPROVED!',
          body: `
            Dear ${supplier.ownerName},

            Congratulations! Your supplier application for ${supplier.businessName} has been approved.

            You can now:
            ✅ Access your supplier dashboard
            ✅ Start receiving part requests
            ✅ Submit quotes to customers
            ✅ Manage your inventory

            Login to your dashboard: https://partsfinda.netlify.app/auth/login
            Use the email and password you provided during registration.

            Welcome to Jamaica's premier auto parts marketplace!

            Best regards,
            The PartsFinda Team
            📞 +876 219 3329
            📧 support@partsfinda.com
          `
        }
      : {
          subject: '❌ Update on Your PartsFinda Supplier Application',
          body: `
            Dear ${supplier.ownerName},

            Thank you for your interest in joining PartsFinda as a supplier.

            Unfortunately, we cannot approve your application at this time.

            Reason: ${reason}

            You can resubmit your application by addressing the issues mentioned above.
            If you have questions, please contact our support team.

            Best regards,
            The PartsFinda Team
            📞 +876 219 3329
            📧 support@partsfinda.com
          `
        };

    // In production, this would use Resend or another email service
    // For now, we'll log the email content
    console.log('Email Details:', {
      to: supplier.email,
      subject: emailContent.subject,
      body: emailContent.body
    });

    return { success: true, message: 'Email notification sent' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email notification' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, action, reason } = body;

    // Validate input
    if (!applicationId || !action) {
      return NextResponse.json(
        { success: false, error: 'Application ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required for rejection' },
        { status: 400 }
      );
    }

    // Find the supplier application
    const supplierIndex = supplierApplications.findIndex(app => app.id === applicationId);

    if (supplierIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    const supplier = supplierApplications[supplierIndex];

    // Update application status
    if (action === 'approve') {
      supplierApplications[supplierIndex].status = 'approved';

      // Create supplier account in the system
      console.log(`✅ Creating supplier account for ${supplier.businessName}`);

      // In production, this would:
      // 1. Create user account in Supabase
      // 2. Set role to 'seller'
      // 3. Create supplier profile
      // 4. Enable dashboard access

    } else {
      supplierApplications[supplierIndex].status = 'rejected';

      console.log(`❌ Rejecting application for ${supplier.businessName}. Reason: ${reason}`);
    }

    // Send notification email
    const emailResult = await sendNotificationEmail(supplier, action, reason);

    // Log the action for admin records
    const logEntry = {
      timestamp: new Date().toISOString(),
      adminAction: action,
      applicationId,
      supplierName: supplier.businessName,
      supplierEmail: supplier.email,
      reason: action === 'reject' ? reason : undefined,
      emailSent: emailResult.success
    };

    console.log('📋 Admin Action Log:', logEntry);

    // Return success response
    return NextResponse.json({
      success: true,
      message: action === 'approve'
        ? `Application approved successfully. ${supplier.ownerName} has been notified and can now access their supplier dashboard.`
        : `Application rejected. ${supplier.ownerName} has been notified with the reason provided.`,
      data: {
        applicationId,
        action,
        supplierName: supplier.businessName,
        emailSent: emailResult.success,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing supplier application:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process application. Please try again.'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check application status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({
        success: true,
        applications: supplierApplications
      });
    }

    const application = supplierApplications.find(app => app.id === applicationId);

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application
    });

  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}
