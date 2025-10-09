import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear all authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0, // Expire immediately
      path: '/'
    };

    response.cookies.set('auth-token', '', cookieOptions);
    response.cookies.set('user-role', '', { ...cookieOptions, httpOnly: false });
    response.cookies.set('user-email', '', { ...cookieOptions, httpOnly: false });
    response.cookies.set('user-name', '', { ...cookieOptions, httpOnly: false });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
