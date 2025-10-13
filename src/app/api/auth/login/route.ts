import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { generateToken } from '@/lib/jwt';
import { LoginRequest, AuthResponse, UserResponse } from '@/types/auth';

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    console.log('🔐 Login attempt started...');

    const body: LoginRequest = await request.json();
    const { email, password } = body;

    console.log('📧 Login attempt for:', email);

    // Validation
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password length validation
    if (password.length < 6) {
      console.log('❌ Password too short');
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user exists in database
    console.log('🔍 Checking database for user...');
    const userResult = await query(
      'SELECT id, email, password, name, role, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // ✅ IMPORTANT: Agar user nahi mila toh error return karein
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' }, // Don't reveal user doesn't exist
        { status: 401 }
      );
    }

    const dbUser = userResult.rows[0];
    
    // Verify password for existing user
    console.log('✅ User found, verifying password...');
    const isPasswordValid: boolean = await verifyPassword(password, dbUser.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if email is verified (optional - depends on your requirements)
    if (!dbUser.email_verified) {
      console.log('⚠️ Email not verified');
      // Aap chahein toh yahan error return kar sakte hain
      // return NextResponse.json(
      //   { success: false, error: 'Please verify your email first' },
      //   { status: 401 }
      // );
    }

    const user: UserResponse = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role
    };

    // Generate JWT token
    const tokenPayload = {
      userId: String(user.id),
      email: user.email,
      name: String(user.name),
      role: user.role
    };
    const authToken: string = generateToken(tokenPayload);

    console.log('✅ Login successful for:', user.email, 'Role:', user.role);

    // Create response
    const response: NextResponse<AuthResponse> = NextResponse.json({
      success: true,
      message: 'Login successful',
      authToken,
      user
    });

    return response;

  } catch (error: any) {
    console.error('❌ Login error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}