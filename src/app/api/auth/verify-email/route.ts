import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendMail } from '@/lib/mailService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/verification-error?error=invalid_token`);
  }

  try {
    // Find user with this verification token
    const userResult = await query(
      `SELECT * FROM users 
       WHERE email = $1 
       AND verification_token = $2 
       AND verification_token_expires > $3`,
      [email, token, new Date()]
    );

    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/verification-error?error=invalid_or_expired`);
    }

    // Update user as verified
    await query(
      `UPDATE users 
       SET email_verified = true, 
           verification_token = NULL, 
           verification_token_expires = NULL,
           updated_at = $1
       WHERE email = $2`,
      [new Date(), email]
    );

    // Send welcome email
    await sendWelcomeEmail(email, user.name || user.owner_name);

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/verification-success?email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/verification-error?error=server_error`);
  }
}

// Welcome Email Template
async function sendWelcomeEmail(userEmail: string, userName: string) {
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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 28px; 
      font-weight: 700;
    }
    .content { 
      padding: 40px 30px; 
      color: #374151;
    }
    .welcome-badge { 
      background: #f0f9ff; 
      border: 2px solid #7c3aed;
      color: #7c3aed;
      padding: 15px;
      border-radius: 10px;
      text-align: center;
      margin-bottom: 30px;
      font-weight: 600;
    }
    .features { 
      display: grid; 
      grid-template-columns: 1fr; 
      gap: 12px; 
      margin: 25px 0; 
    }
    .feature { 
      background: #f8fafc; 
      padding: 15px; 
      border-radius: 8px; 
      border-left: 4px solid #7c3aed;
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
    }
    .footer { 
      text-align: center; 
      color: #6b7280; 
      font-size: 14px; 
      margin-top: 30px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to PartsFinda!</h1>
      <p>Your Email Has Been Successfully Verified</p>
    </div>

    <div class="content">
      <div class="welcome-badge">
        ✅ Email Verified Successfully
      </div>

      <p>Hello <strong>${userName}</strong>,</p>
      
      <p>Great news! Your email address has been successfully verified. You're one step closer to becoming a verified seller on PartsFinda.</p>

      <p><strong>What happens next?</strong></p>
      
      <div class="features">
        <div class="feature">
          <strong>📧 Email Verified</strong>
          <p>Your email address is now confirmed and secure</p>
        </div>
        <div class="feature">
          <strong>⏳ Account Review</strong>
          <p>Our team is reviewing your seller application</p>
        </div>
        <div class="feature">
          <strong>✅ Final Approval</strong>
          <p>Once approved, you'll receive buyer requests and can start selling</p>
        </div>
      </div>

      <p><strong>Important:</strong> You can only login after your seller account is fully approved by our management team. We'll notify you once the verification process is complete.</p>

      <center>
        <a href="${process.env.NEXTAUTH_URL}" class="button">
          Visit Our Website
        </a>
      </center>

      <p style="text-align: center; color: #6b7280; font-size: 14px;">
        Thank you for choosing PartsFinda - Jamaica's premier auto parts marketplace!
      </p>
    </div>

    <div class="footer">
      <p><strong>Ready to revolutionize auto parts shopping in Jamaica! 🚗</strong></p>
      <p>© 2025 PartsFinda Inc. | Auto Parts Marketplace</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendMail({
      to: userEmail,
      subject: '🎉 Welcome to PartsFinda - Email Verified Successfully!',
      html: emailHtml,
    });
    console.log(`✅ Welcome email sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
  }
}