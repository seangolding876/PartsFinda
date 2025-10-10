import { NextResponse } from 'next/server';

interface LogoutResponse {
  success: boolean;
  message: string;
}

export async function POST(): Promise<NextResponse<LogoutResponse>> {
  const response: NextResponse<LogoutResponse> = NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });

  // Clear all auth cookies
  const cookiesToClear: string[] = ['auth-token', 'user-role', 'user-email', 'user-name'];
  
  cookiesToClear.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      httpOnly: false,
      secure: false,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      path: '/'
    });
  });

  return response;
}