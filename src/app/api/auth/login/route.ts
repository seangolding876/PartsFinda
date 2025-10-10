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
      'SELECT id, email, password, name, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    let user: UserResponse | null = null;

    if (userResult.rows.length > 0) {
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

      user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role
      };
    } else {
      // Create new user
      console.log('🆕 Creating new user account...');
      const { hashPassword } = await import('@/lib/password');
      
      const name: string = email.split('@')[0].replace(/[^a-zA-Z\s]/g, ' ').trim() || 'New User';
      const role: 'buyer' | 'seller' = email.toLowerCase().includes('seller') || email.toLowerCase().includes('supplier') ? 'seller' : 'buyer';
      const hashedPassword: string = await hashPassword(password);

      const newUserResult = await query(
        `INSERT INTO users (email, password, name, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, name, role`,
        [email.toLowerCase(), hashedPassword, name, role]
      );

      user = newUserResult.rows[0] as UserResponse;
      console.log('✅ New user created:', { email: user.email, role: user.role });
    }

    if (!user) {
      console.log('❌ Authentication failed - no user found');
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const tokenPayload = {
      userId: String(user.id),
      email: user.email,
      name: String(user.name),
      role: user.role
    };
    const authToken: string = generateToken(tokenPayload);

    console.log('✅ Login successful for:', user.email, 'Role:', user.role);

    // Create response - sirf data return karein, localStorage set nahi karein
    const response: NextResponse<AuthResponse> = NextResponse.json({
      success: true,
      message: 'Login successful',
      authToken,
      user
    });

    return response;

  } catch (error: any) {
    console.error('❌ Login error:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}