import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { generateToken } from '@/lib/jwt';
import { RegisterRequest, AuthResponse, UserResponse } from '@/types/auth';
import { v4 as uuidv4 } from 'uuid'; 
import { sendMail } from '@/lib/mailService'; 
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const body: RegisterRequest = await request.json();
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const { email, password, name, phone, role = 'buyer' } = body;

const emailAllowed = await rateLimit(`reg:${email.toLowerCase()}`, 1, 24 * 60 * 60);
if (!emailAllowed) {
  return NextResponse.json(
    { success: false, error: "Registration already attempted. Try again later." },
    { status: 429 }
  );
}
    
// ✅ Global Rate Limiting - ADNAN
const allowed = await rateLimit(clientIP, 3, 60 * 60); // 5 req/hour

if (!allowed) {
  return NextResponse.json(
    { success: false, error: "Too many submissions. Please try again later." },
    { status: 429 }
  );
}

    // Validation
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Email, password, name, and phone are required' },
        { status: 400 }
      );
    }

    const nameValidation = isValidName(name);
if (!nameValidation.valid) {
  return NextResponse.json(
    { success: false, error: nameValidation.message || 'Invalid name format' },
    { status: 400 }
  );
}

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    const verificationToken = uuidv4() + Date.now();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Hash password and create user
    const hashedPassword: string = await hashPassword(password);
    
    const result = await query(
      `INSERT INTO users (email, password, name, phone, role, verification_token, verification_token_expires, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, email, name, phone, role, email_verified`,
      [email.toLowerCase(), hashedPassword, name, phone, role, verificationToken, verificationTokenExpires, false]
    );

    const user: UserResponse = result.rows[0] as UserResponse;

    // Generate token
    const tokenPayload = {
      userId: String(user.id),
      email: user.email,
      name: String(user.name),
      role: user.role
    };

    const authToken: string = generateToken(tokenPayload);

    // Send verification email
    try {
      await sendBuyerVerificationEmail(
        user.email, 
        user.name, 
        verificationToken
      );
      console.log('✅ Verification email sent successfully');
    } catch (emailError: any) {
      console.error('❌ Email sending failed:', emailError);
      // Email failure shouldn't break registration
    }

    // Set cookies
    const response: NextResponse<AuthResponse> = NextResponse.json({
      success: true,
      message: 'Registration successful',
      authToken,
      user
    });

    const isProduction: boolean = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: false,
      secure: false,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    };

    response.cookies.set('auth-token', authToken, cookieOptions);
    response.cookies.set('user-role', user.role, cookieOptions);
    response.cookies.set('user-email', user.email, cookieOptions);
    response.cookies.set('user-name', user.name, cookieOptions);

    return response;

  } catch (error: any) {
    console.error('Buyer registration error:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }

  // Name validation helper - realistic but not too strict
function isValidName(name: string): { valid: boolean; message?: string } {
  const trimmed = name.trim();
  
  // 1. Basic length checks
  if (trimmed.length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' };
  }
  if (trimmed.length > 100) {
    return { valid: false, message: 'Name is too long' };
  }

  // 2. Must contain at least 2 actual letters (Unicode aware - supports international names)
  const letters = [...trimmed].filter(char => /\p{L}/u.test(char));
  if (letters.length < 2) {
    return { valid: false, message: 'Name must contain at least 2 letters' };
  }

  // 3. Reject obvious bot/gibberish patterns:
  
  // Pattern A: Long alphanumeric string with NO spaces (like your example "bFeHGAkozkjVUgOmvijml")
  if (/^[a-zA-Z0-9]{12,}$/.test(trimmed.replace(/\s+/g, '')) && !/\s/.test(trimmed)) {
    return { valid: false, message: 'Please enter a real name (not random characters)' };
  }

  // Pattern B: Too many consecutive uppercase letters (e.g., "ABCdefGHI")
  const consecutiveUpper = trimmed.match(/[A-Z]{4,}/);
  if (consecutiveUpper && consecutiveUpper[0].length / trimmed.length > 0.4) {
    return { valid: false, message: 'Name appears invalid' };
  }

  // Pattern C: Suspicious character ratio (too many numbers/symbols)
  const suspiciousChars = [...trimmed].filter(char => 
    !/\p{L}/u.test(char) && 
    char !== ' ' && 
    char !== '-' && 
    char !== "'" && 
    char !== '.' && 
    char !== '’'
  ).length;
  
  if (suspiciousChars / trimmed.length > 0.3) {
    return { valid: false, message: 'Name contains too many unusual characters' };
  }

  // 4. Allow legitimate formats:
  // ✅ "John Doe" (spaces)
  // ✅ "O'Brien" (apostrophe)
  // ✅ "Mary-Jane" (hyphen)
  // ✅ "José" (Unicode)
  // ✅ "محمد" (Arabic/Urdu names)
  // ❌ "bFeHGAkozkjVUgOmvijml" (rejected - no spaces, looks random)

  return { valid: true };
}
}




async function sendBuyerVerificationEmail(userEmail: string, userName: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/buyer/verify-email?token=${token}&email=${encodeURIComponent(userEmail)}`;

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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
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
    .verification-box { 
      background: #f0fdf4; 
      border: 2px dashed #10b981;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .button { 
      background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
      color: white !important; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 6px; 
      display: inline-block; 
      margin: 15px 0; 
      font-weight: 600;
      border: none;
      cursor: pointer;
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
      <h1>Verify Your Email Address</h1>
      <p>Complete your PartsFinda buyer registration</p>
    </div>
    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Thank you for registering as a buyer on PartsFinda! To complete your registration, please verify your email address by clicking the button below:</p>
      <div class="verification-box">
        <p><strong>Action Required:</strong> Verify your email within 24 hours</p>
        <a href="${verificationUrl}" class="button" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; font-weight: 600; border: none; cursor: pointer; text-align: center;">
          Verify Email Address
        </a>
      </div>
      <p style="font-size: 12px; color: #6b7280;">
        If the button doesn't work, copy and paste this link in your browser:<br>
        <a href="${verificationUrl}" style="color: #10b981; word-break: break-all;">${verificationUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>This verification link will expire in 24 hours.</p>
      <p>© 2025 PartsFinda Inc. | Auto Parts Marketplace</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendMail({
      to: userEmail,
      subject: 'Verify Your Email - PartsFinda Buyer Registration',
      html: emailHtml,
    });
    console.log(`✅ Verification email sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}