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

    // Check if user exists in database - ALL USERS (without email_verified check)
    console.log('🔍 Checking database for user...');
    const userResult = await query(
      `SELECT 
        id, email, password, name, role, 
        email_verified, verified_status 
       FROM users 
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    // ✅ IMPORTANT: Agar user nahi mila toh error return karein
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
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

    // 🔐 ROLE-BASED ACCESS CONTROL

    // 1. ADMIN - No restrictions
    if (dbUser.role === 'admin') {
      console.log('👑 Admin login attempt');
      // Admin ke liye koi check nahi - direct access
    }

    // 2. SELLER - Strict verification required
    else if (dbUser.role === 'seller') {
      console.log('🏪 Seller login attempt - Checking verification status...');
      
      // Case 1: Email not verified
      if (!dbUser.email_verified) {
        console.log('❌ Seller email not verified');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Please verify your email first. Check your inbox for verification link.' 
          },
          { status: 403 }
        );
      }
      
      // Case 2: Email verified but account not approved
      if (dbUser.email_verified && dbUser.verified_status !== 'approved') {
        console.log('⚠️ Seller email verified but account pending approval');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Your account is under review. You will receive an email once approved. This usually takes 1-2 business days.' 
          },
          { status: 403 }
        );
      }

      // Case 3: Fully verified and approved seller
      if (dbUser.email_verified && dbUser.verified_status === 'approved') {
        console.log('✅ Seller fully verified and approved');
      }
    }

    // 3. BUYER - Only email verification required
    else if (dbUser.role === 'buyer') {
      console.log('🛒 Buyer login attempt - Checking email verification...');
      
      if (!dbUser.email_verified) {
        console.log('❌ Buyer email not verified');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Please verify your email first. Check your inbox for verification link.' 
          },
          { status: 403 }
        );
      }
      
      console.log('✅ Buyer email verified');
    }

    // 4. Unknown role
    else {
      console.log('❌ Unknown user role:', dbUser.role);
      return NextResponse.json(
        { success: false, error: 'Invalid user role' },
        { status: 403 }
      );
    }

    // Prepare user data for response
    const user: UserResponse = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
    };

    // Generate JWT token
    const tokenPayload = {
      userId: String(user.id),
      email: user.email,
      name: String(user.name),
      role: user.role,
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