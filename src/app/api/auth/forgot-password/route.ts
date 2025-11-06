import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendMail } from '@/lib/mailService';
import { v4 as uuidv4 } from 'uuid';
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

        const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const ipAllowed = await rateLimit(`fp:ip:${ip}`, 5, 60 * 60);
    if (!ipAllowed) {
      return NextResponse.json(
        { success: true, message: "If an account exists, reset instructions were sent." },
        { status: 200 }
      );
    }

    const emailAllowed = await rateLimit(`fp:email:${email.toLowerCase()}`, 2, 60 * 60);
    if (!emailAllowed) {
      return NextResponse.json(
        { success: true, message: "If an account exists, reset instructions were sent." },
        { status: 200 }
      );
    }

    // Check if user exists
    const userResult = await query(
      'SELECT id, name, email, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Return success even if user doesn't exist for security
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, reset instructions have been sent.'
      });
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = uuidv4() + Date.now();
    const resetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    await query(
      `UPDATE users 
       SET reset_token = $1, 
           reset_token_expires = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [resetToken, resetTokenExpires, user.id]
    );

    // Send reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, reset instructions have been sent.'
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Password Reset Email Template
async function sendPasswordResetEmail(userEmail: string, userName: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(userEmail)}`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: #f3f4f6;
      margin: 0;
      padding: 40px 20px;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 10px; 
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header { 
      background: #7c3aed; 
      color: white; 
      padding: 30px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 24px; 
      font-weight: 700;
    }
    .content { 
      padding: 30px; 
      color: #374151;
    }
    .reset-box { 
      background: #faf5ff; 
      border: 2px dashed #7c3aed;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .footer { 
      text-align: center; 
      color: #6b7280; 
      font-size: 12px; 
      margin-top: 20px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Your Password</h1>
      <p>PartsFinda Account Security</p>
    </div>
    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      <p>We received a request to reset your password for your PartsFinda account. Click the button below to create a new password:</p>
      <div class="reset-box">
        <p><strong>Action Required:</strong> Reset your password within 1 hour</p>
        <a href="${resetUrl}" style="background: #7c3aed; color: #ffffff !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; font-weight: 600; font-size: 16px; border: none; cursor: pointer; text-align: center;">
          Reset Password
        </a>
      </div>
      <p style="font-size: 12px; color: #6b7280;">
        If the button doesn't work, copy and paste this link in your browser:<br>
        <a href="${resetUrl}" style="color: #7c3aed; word-break: break-all;">${resetUrl}</a>
      </p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        <strong>Note:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
      </p>
    </div>
    <div class="footer">
      <p>This reset link will expire in 1 hour.</p>
      <p>© 2025 PartsFinda Inc. | Auto Parts Marketplace</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendMail({
      to: userEmail,
      subject: 'Reset Your Password - PartsFinda',
      html: emailHtml,
    });
    console.log(`✅ Password reset email sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}