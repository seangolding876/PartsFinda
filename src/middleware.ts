import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of protected routes that require authentication
const protectedRoutes = [
  '/seller/dashboard',
  '/seller/subscription',
  '/profile',
  '/messages',
  '/cart',
  '/checkout'
];

// List of seller-only routes
const sellerOnlyRoutes = [
  '/seller/dashboard',
  '/seller/subscription'
];

// List of auth routes (shouldn't be accessible when logged in)
const authRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/seller-signup'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth-token');
  const userRole = request.cookies.get('user-role');

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isSellerRoute = sellerOnlyRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // If accessing protected route without auth, redirect to login
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing seller-only route without seller role, redirect to home
  if (isSellerRoute && (!authToken || userRole?.value !== 'seller')) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // If accessing auth routes while logged in, redirect to appropriate dashboard
  if (isAuthRoute && authToken) {
    if (userRole?.value === 'seller') {
      return NextResponse.redirect(new URL('/seller/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
