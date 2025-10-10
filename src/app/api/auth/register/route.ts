import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { generateToken } from '@/lib/jwt';
import { RegisterRequest, AuthResponse, UserResponse } from '@/types/auth';

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const body: RegisterRequest = await request.json();
    const { email, password, name, role = 'buyer' } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
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

    // Hash password and create user
    const hashedPassword: string = await hashPassword(password);
    
    const result = await query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, role`,
      [email.toLowerCase(), hashedPassword, name, role]
    );

    const user: UserResponse = result.rows[0] as UserResponse;

    // Generate token
    const tokenPayload = {
      userId: String(user.id),
      email: user.email,
      name: user.name
    };

    const authToken: string = generateToken(tokenPayload);

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
    console.error('Registration error:', error);
    
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
}