'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Settings, Users } from 'lucide-react';

export default function Navigation() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = useCallback(() => {
    try {
      console.log('Checking auth status...');
      // Check for authentication cookies
      const authToken = getCookie('auth-token');
      const role = getCookie('user-role');
      const name = getCookie('user-name');
      const email = getCookie('user-email');

      console.log('Auth cookies:', { authToken: !!authToken, role, name, email });

      if (authToken && role) {
        setIsAuthenticated(true);
        setUserRole(role);
        setUserName(name || email || 'User');
        console.log('User authenticated:', { role, name: name || email });
      } else {
        setIsAuthenticated(false);
        setUserRole('');
        setUserName('');
        console.log('User not authenticated');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();

    // Listen for custom auth change events
    const handleAuthChange = () => {
      console.log('Auth change detected, refreshing status...');
      checkAuthStatus();
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange); // For cross-tab updates

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [checkAuthStatus]);

  const getCookie = (name: string): string => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || '';
    }
    return '';
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      // Call logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        console.log('Logout successful');
      }

      // Clear state
      setIsAuthenticated(false);
      setUserRole('');
      setUserName('');

      // Show success message and force page reload
      alert('Logged out successfully');

      // Force page reload to clear auth state completely
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API fails
      setIsAuthenticated(false);
      setUserRole('');
      setUserName('');
      window.dispatchEvent(new CustomEvent('authChange'));
      router.push('/');
    }
  };

  const triggerAuthRefresh = () => {
    console.log('Manually triggering auth refresh...');
    checkAuthStatus();
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xl">
              PartFinda
            </div>
            <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-semibold">
              Jamaica
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <Link href="/request-part" className="hover:text-blue-600">Request Part</Link>
            <Link href="/vin-decoder" className="hover:text-blue-600">VIN Decoder</Link>
            <Link href="/contact" className="hover:text-blue-600">Contact</Link>

            {isAuthenticated && (
              <>
                {/* Messages - Available to all authenticated users */}
                <Link href="/messages" className="hover:text-blue-600 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>

                {userRole === 'buyer' && (
                  <Link href="/my-requests" className="hover:text-blue-600">My Requests</Link>
                )}

                {userRole === 'seller' && (
                  <Link href="/seller/dashboard" className="hover:text-blue-600">Dashboard</Link>
                )}

                {/* Admin Dashboard - Only for admin users */}
                {userRole === 'admin' && (
                  <Link href="/admin/dashboard" className="hover:text-blue-600 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  <span className="text-sm text-gray-600">
                    Welcome, <span className="font-semibold">{userName}</span>
                  </span>
                  {userRole && (
                    <span className="text-xs text-blue-600 ml-2 capitalize">
                      ({userRole})
                    </span>
                  )}
                </div>

                {/* Role-based primary action button */}
                {userRole === 'buyer' ? (
                  <Link
                    href="/my-requests"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                  >
                    My Requests
                  </Link>
                ) : userRole === 'seller' ? (
                  <Link
                    href="/seller/dashboard"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                  >
                    Dashboard
                  </Link>
                ) : userRole === 'admin' ? (
                  <Link
                    href="/admin/dashboard"
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm flex items-center gap-1"
                  >
                    <Settings className="w-4 h-4" />
                    Admin
                  </Link>
                ) : (
                  <Link
                    href="/request-part"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                  >
                    Request Part
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded transition-colors"
                >
                  Sign In
                </Link>
                <div className="flex gap-2">
                  <Link
                    href="/auth/register"
                    className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/auth/seller-signup"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Become Supplier
                  </Link>
                </div>
              </div>
            )}

            {/* Debug button in development */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={triggerAuthRefresh}
                className="text-xs bg-gray-200 px-2 py-1 rounded"
                title="Refresh Auth Status"
              >
                ↻
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu - Enhanced with new features */}
        <div className="md:hidden mt-4 border-t pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <Link href="/request-part" className="hover:text-blue-600">Request Part</Link>
            <Link href="/vin-decoder" className="hover:text-blue-600">VIN Decoder</Link>
            <Link href="/contact" className="hover:text-blue-600">Contact</Link>

            {isAuthenticated && (
              <>
                <Link href="/messages" className="hover:text-blue-600 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Messages
                </Link>

                {userRole === 'buyer' && (
                  <Link href="/my-requests" className="hover:text-blue-600">My Requests</Link>
                )}
                {userRole === 'seller' && (
                  <Link href="/seller/dashboard" className="hover:text-blue-600">Dashboard</Link>
                )}
                {userRole === 'admin' && (
                  <Link href="/admin/dashboard" className="hover:text-blue-600 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Admin
                  </Link>
                )}

                {/* Mobile logout */}
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
