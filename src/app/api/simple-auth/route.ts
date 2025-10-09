import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, action } = body;

    console.log('Simple auth request:', { email, action });

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password required'
      }, { status: 400 });
    }

    // For demo - accept any email/password combo
    const user = {
      id: `user_${Date.now()}`,
      email: email,
      name: email.split('@')[0],
      role: email.includes('seller') ? 'seller' : 'buyer'
    };

    console.log('Auth successful for:', user);

    // Create simple response
    const response = NextResponse.json({
      success: true,
      message: action === 'register' ? 'Account created!' : 'Login successful!',
      user: user
    });

    // Set simple cookies
    response.cookies.set('partsfinda-user', JSON.stringify(user), {
      httpOnly: false,
      secure: false, // Allow on HTTP for testing
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Simple auth error:', error);
    return NextResponse.json({
      success: false,
      error: 'Authentication failed'
    }, { status: 500 });
  }
}
