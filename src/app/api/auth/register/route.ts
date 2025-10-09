import { NextRequest, NextResponse } from 'next/server';

// Simulate database with localStorage-like persistence
// In production, this would be Supabase
function getStoredUsers() {
  // For serverless, we'll use a simple approach that works for demo
  // In real production, use Supabase
  return [];
}

function storeUser(user: any) {
  // In production, this would save to Supabase
  console.log('User registered:', user.email);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Create user (simplified for demo)
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      name,
      phone: phone || '',
      role: 'buyer',
      createdAt: new Date().toISOString()
    };

    // Store user (in production, use Supabase)
    storeUser(newUser);

    // Generate auth token
    const authToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      authToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });

    // Set HTTP-only cookies for authentication
    response.cookies.set('auth-token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    response.cookies.set('user-role', newUser.role, {
      httpOnly: false, // Allow client access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    response.cookies.set('user-email', newUser.email, {
      httpOnly: false, // Allow client access for display
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    response.cookies.set('user-name', newUser.name, {
      httpOnly: false, // Allow client access for display
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
