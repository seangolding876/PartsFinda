import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendMail } from '@/lib/mailService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/buyer/verification-error?error=invalid_token`);
  }

  try {
    // Find buyer with this verification token
    const userResult = await query(
      `SELECT * FROM users 
       WHERE email = $1 
       AND verification_token = $2 
       AND verification_token_expires > $3
       AND role = 'buyer'`,
      [email, token, new Date()]
    );

    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/buyer/verification-error?error=invalid_or_expired`);
    }

    // Update buyer as verified
    await query(
      `UPDATE users 
       SET email_verified = true, 
           verification_token = NULL, 
           verification_token_expires = NULL,
           updated_at = $1
       WHERE email = $2 AND role = 'buyer'`,
      [new Date(), email]
    );

    // Send welcome email to buyer
    await sendBuyerWelcomeEmail(email, user.name);

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/buyer/verification-success?email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error('Buyer email verification error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/buyer/verification-error?error=server_error`);
  }
}

// Buyer Welcome Email Template
async function sendBuyerWelcomeEmail(userEmail: string, userName: string) {
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
      background: #f0fdf4; 
      border: 2px solid #10b981;
      color: #059669;
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
      border-left: 4px solid #10b981;
    }
    .button { 
      background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
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
      <p>Your Buyer Account is Now Active</p>
    </div>

    <div class="content">
      <div class="welcome-badge">
        ✅ Email Verified Successfully
      </div>

      <p>Hello <strong>${userName}</strong>,</p>
      
      <p>Great news! Your email address has been successfully verified and your buyer account is now fully activated.</p>

      <p><strong>Start exploring today:</strong></p>
      
      <div class="features">
        <div class="feature">
          <strong>🔍 Search Parts</strong>
          <p>Find genuine auto parts from trusted suppliers across Jamaica</p>
        </div>
        <div class="feature">
          <strong>🏪 Compare Prices</strong>
          <p>Get the best deals from multiple verified sellers</p>
        </div>
        <div class="feature">
          <strong>📞 Direct Contact</strong>
          <p>Connect directly with sellers for quick responses</p>
        </div>
        <div class="feature">
          <strong>💾 Save Favorites</strong>
          <p>Save your favorite parts and suppliers for easy access</p>
        </div>
      </div>

      <p><strong>Ready to find your parts?</strong> Start browsing our extensive catalog now!</p>

      <center>
        <a href="${process.env.NEXTAUTH_URL}/parts" class="button">
          Start Shopping Now
        </a>
      </center>

      <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
        Happy shopping! 🚗
      </p>
    </div>

    <div class="footer">
      <p><strong>Your trusted auto parts marketplace in Jamaica! 🇯🇲</strong></p>
      <p>© 2025 PartsFinda Inc. | Auto Parts Marketplace</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendMail({
      to: userEmail,
      subject: '🎉 Welcome to PartsFinda - Your Buyer Account is Ready!',
      html: emailHtml,
    });
    console.log(`✅ Buyer welcome email sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Failed to send buyer welcome email:', error);
  }
}