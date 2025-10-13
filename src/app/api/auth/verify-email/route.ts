import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyEmailToken, markTokenAsUsed } from '@/lib/email-verification';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify the token
    const tokenData = await verifyEmailToken(token);
    
    // Update user email verification status
    await query(
      'UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [tokenData.user_id]
    );

    // Mark token as used
    await markTokenAsUsed(token);

    // Get user details for confirmation email
    const userResult = await query(
      `SELECT u.email, u.name, u.business_name, u.membership_plan 
       FROM users u WHERE u.id = $1`,
      [tokenData.user_id]
    );

    const user = userResult.rows[0];

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Email Verified Successfully - PartFinda Jamaica',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">✅ Email Verified Successfully!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">PartFinda Jamaica</p>
          </div>
          
          <div style="padding: 30px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to PartFinda Jamaica!</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Hello <strong>${user.name}</strong>,
            </p>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Your email has been successfully verified! Your seller application is now under review.
            </p>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #065f46; margin-bottom: 15px;">What's Next?</h3>
              <ul style="color: #065f46; padding-left: 20px;">
                <li>Our team will review your application</li>
                <li>You'll receive approval within 2-3 business days</li>
                <li>Once approved, you can start listing parts</li>
                <li>Check your email for further updates</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Go to Login
              </a>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
            <p>&copy; 2024 PartFinda Jamaica. All rights reserved.</p>
          </div>
        </div>
      `
    });

    // Also notify admin about email verification
    await sendEmail({
      to: 'admin@partfinda.jm',
      subject: 'Seller Email Verified - Application Ready for Review',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Seller Email Verified - Ready for Review</h2>
          <p><strong>Business:</strong> ${user.business_name}</p>
          <p><strong>Owner:</strong> ${user.name}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Membership Plan:</strong> ${user.membership_plan}</p>
          <p><strong>Status:</strong> Ready for application review</p>
        </div>
      `
    });

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/email-verified-success`
    );

  } catch (error: any) {
    console.error('❌ Email verification error:', error);
    
    // Redirect to error page
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verification-error?error=${encodeURIComponent(error.message)}`
    );
  }
}