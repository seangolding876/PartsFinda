// app/api/admin/approve-application/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { sendMail } from '@/lib/mailService';

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
      `SELECT id, email, name FROM users WHERE id = $1 AND role = 'seller'`,
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
      
      // Send approval email
      await sendApprovalEmail(application.email, application.name);
      
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
      
      // Send rejection email
      await sendRejectionEmail(application.email, application.name, reason);
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

// ✅ Approval Email Template
async function sendApprovalEmail(userEmail: string, userName: string) {
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 15px; 
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 28px; 
      font-weight: 700;
    }
    .header p { 
      margin: 10px 0 0; 
      font-size: 16px; 
      opacity: 0.9;
    }
    .content { 
      padding: 40px 30px; 
      color: #374151;
    }
    .congratulations { 
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 25px;
      border-radius: 10px;
      text-align: center;
      margin-bottom: 30px;
    }
    .congratulations h2 {
      margin: 0 0 10px;
      font-size: 24px;
    }
    .message-box { 
      background: #f8fafc; 
      border-left: 4px solid #7c3aed; 
      padding: 20px; 
      margin: 25px 0; 
      border-radius: 0 8px 8px 0;
    }
    .features { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 15px; 
      margin: 30px 0; 
    }
    .feature { 
      background: #f0f9ff; 
      padding: 15px; 
      border-radius: 8px; 
      text-align: center;
      border: 1px solid #e0f2fe;
    }
    .button { 
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); 
      color: white; 
      padding: 15px 40px; 
      text-decoration: none; 
      border-radius: 8px; 
      display: inline-block; 
      margin: 20px 0; 
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(124, 58, 237, 0.3);
    }
    .footer { 
      text-align: center; 
      color: #6b7280; 
      font-size: 14px; 
      margin-top: 40px; 
      padding-top: 30px; 
      border-top: 1px solid #e5e7eb; 
    }
    .highlight {
      color: #7c3aed;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
      <p>Your PartsFinda Seller Account Has Been Verified</p>
    </div>

    <div class="content">
      <div class="congratulations">
        <h2>Account Successfully Verified</h2>
        <p>You're now ready to start your journey with PartsFinda</p>
      </div>

      <p>Hello <strong class="highlight">${userName}</strong>,</p>
      
      <div class="message-box">
        <p style="margin: 0; font-size: 16px; line-height: 1.6;">
          <strong>Congratulations! 🎊</strong> Your account has been successfully verified! 
          If you have also completed email verification, you can now access our website 
          as a fully authorized seller and start growing your business.
        </p>
      </div>

      <p>You now have full access to these features:</p>
      
      <div class="features">
        <div class="feature">
          <strong>👥 Reach Customers</strong>
          <p>Connect with thousands of potential buyers</p>
        </div>
        <div class="feature">
          <strong>💰 Increase Sales</strong>
          <p>Grow your earnings with our platform</p>
        </div>
        <div class="feature">
          <strong>🏆 Build Trust</strong>
          <p>Gain customer trust with verified seller badge</p>
        </div>
      </div>

      <center>
        <a href="${process.env.NEXTAUTH_URL}/seller/dashboard" class="button" style="text-align: center; color: white; font-size: 14px;">
          🚀 Start Selling Now
        </a>
      </center>

      <p style="text-align: center; color: #6b7280; font-size: 14px;">
        If you need any help, our support team is always ready to assist you!
      </p>
    </div>

    <div class="footer">
      <p><strong>Happy Selling! 🎯</strong></p>
      <p>You're receiving this email because your seller account was successfully verified on PartsFinda</p>
      <p>© 2025 PartsFinda Inc. | Auto Parts Marketplace</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendMail({
      to: userEmail,
      subject: '🎉 Congratulations! Your PartsFinda Seller Account is Verified',
      html: emailHtml,
    });
    console.log(`✅ Approval email sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Failed to send approval email:', error);
    // Don't throw error - email failure shouldn't break the main flow
  }
}
// ✅ Rejection Email Template
async function sendRejectionEmail(userEmail: string, userName: string, rejectionReason: string) {
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      margin: 0;
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 15px; 
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 28px; 
      font-weight: 700;
    }
    .header p { 
      margin: 10px 0 0; 
      font-size: 16px; 
      opacity: 0.9;
    }
    .content { 
      padding: 40px 30px; 
      color: #374151;
    }
    .notice { 
      background: linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%);
      color: #92400e;
      padding: 25px;
      border-radius: 10px;
      text-align: center;
      margin-bottom: 30px;
      border: 1px solid #f59e0b;
    }
    .message-box { 
      background: #fef2f2; 
      border-left: 4px solid #ef4444; 
      padding: 20px; 
      margin: 25px 0; 
      border-radius: 0 8px 8px 0;
    }
    .contact-info { 
      background: #f0f9ff; 
      padding: 20px; 
      border-radius: 10px; 
      margin: 25px 0;
      border: 1px solid #e0f2fe;
    }
    .button { 
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
      color: white; 
      padding: 15px 40px; 
      text-decoration: none; 
      border-radius: 8px; 
      display: inline-block; 
      margin: 20px 0; 
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
    }
    .footer { 
      text-align: center; 
      color: #6b7280; 
      font-size: 14px; 
      margin-top: 40px; 
      padding-top: 30px; 
      border-top: 1px solid #e5e7eb; 
    }
    .highlight {
      color: #ef4444;
      font-weight: 600;
    }
    .reason-box {
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
      border-left: 3px solid #94a3b8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Application Update</h1>
      <p>Your PartsFinda Seller Application Status</p>
    </div>

    <div class="content">
      <div class="notice">
        <h2 style="margin: 0 0 10px;">Application Review Required</h2>
        <p style="margin: 0;">We need some additional information to proceed</p>
      </div>

      <p>Hello <strong class="highlight">${userName}</strong>,</p>
      
      <div class="message-box">
        <p style="margin: 0; font-size: 16px; line-height: 1.6;">
          Your seller application has been <strong>rejected</strong>. 
          There could be several reasons for this, and we've provided details below.
        </p>
      </div>

      <div class="reason-box">
        <strong>📋 Reason for Rejection:</strong>
        <p style="margin: 10px 0 0; color: #64748b;">
          ${rejectionReason || 'Application requirements not fully met. Please contact support for detailed information.'}
        </p>
      </div>

      <p>If you have any questions or need additional information, you can always contact our support team:</p>

      <div class="contact-info">
        <h3 style="margin-top: 0;">📞 Contact Our Support Team</h3>
        <p style="margin: 10px 0;">
          <strong>Email:</strong> 
          <a href="mailto:contact@partsfinda.com" style="color: #2563eb;">
            support@partsfinda.com
          </a>
        </p>
        <p style="margin: 10px 0;">
          <strong>Response Time:</strong> Within 24 hours
        </p>
        <p style="margin: 10px 0;">
          Our team will provide complete assistance in resolving your matter.
        </p>
      </div>

      <center>
        <a href="mailto:contact@partsfinda.com" class="button">
          📧 Contact Support Now
        </a>
      </center>

      <p style="text-align: center; color: #6b7280; font-size: 14px;">
        You can apply again once you complete all the requirements.
      </p>
    </div>

    <div class="footer">
      <p><strong>We're Here to Help! 🤝</strong></p>
      <p>You're receiving this email because your seller application requires additional review</p>
      <p>© 2025 PartsFinda Inc. | Auto Parts Marketplace</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendMail({
      to: userEmail,
      subject: '⚠️ Your PartsFinda Seller Application Requires Attention',
      html: emailHtml,
    });
    console.log(`✅ Rejection email sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Failed to send rejection email:', error);
    // Don't throw error - email failure shouldn't break the main flow
  }
}