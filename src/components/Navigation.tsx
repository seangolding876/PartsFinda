'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Settings, Users } from 'lucide-react';

// Auth utility functions
const getAuthData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const authData = localStorage.getItem('authData');
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    console.error('Error getting auth data:', error);
    return null;
  }
};

const isAuthenticated = () => {
  const authData = getAuthData();
  return !!(authData?.token);
};

const logout = () => {
  localStorage.removeItem('authData');
  window.location.href = '/login';
};

export default function Navigation() {
  const router = useRouter();
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = useCallback(() => {
    try {
      console.log('🔍 Checking auth status from localStorage...');
      
      const authData = getAuthData();
      console.log('Auth data from localStorage:', authData);

      if (authData && authData.token) {
        setIsAuthenticatedState(true);
        setUserRole(authData.role || '');
        setUserName(authData.name || authData.email || 'User');
        console.log('✅ User authenticated:', { 
          role: authData.role, 
          name: authData.name || authData.email 
        });
      } else {
        setIsAuthenticatedState(false);
        setUserRole('');
        setUserName('');
        console.log('❌ User not authenticated');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticatedState(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();

    // Listen for storage changes (across tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authData') {
        console.log('🔄 Storage change detected, refreshing auth status...');
        checkAuthStatus();
      }
    };

    // Listen for custom auth events
    const handleAuthEvent = () => {
      console.log('🔄 Custom auth event received, refreshing status...');
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthEvent);

    // Check auth status periodically (every 30 seconds)
    const interval = setInterval(checkAuthStatus, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthEvent);
      clearInterval(interval);
    };
  }, [checkAuthStatus]);

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...');
      
      // Optional: Call logout API if you have one
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
        });
        console.log('Logout API response:', response.status);
      } catch (apiError) {
        console.log('Logout API not available, continuing with client-side logout');
      }

      // Clear localStorage
      localStorage.removeItem('authData');
      
      // Clear state
      setIsAuthenticatedState(false);
      setUserRole('');
      setUserName('');

      // Dispatch auth change event for other components
      window.dispatchEvent(new CustomEvent('authChange'));

      console.log('✅ Logout successful');

      // Show success message and redirect
      alert('Logged out successfully');

      // Redirect to home page
      window.location.href = '/';

    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if something fails
      localStorage.removeItem('authData');
      setIsAuthenticatedState(false);
      window.dispatchEvent(new CustomEvent('authChange'));
      window.location.href = '/';
    }
  };

  const triggerAuthRefresh = () => {
    console.log('🔄 Manually triggering auth refresh...');
    checkAuthStatus();
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xl">
              PartsFinda
            </div>
            <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-semibold">
              Jamaica
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <Link href="/request-part" className="hover:text-blue-600 transition-colors">Request Part</Link>
            <Link href="/vin-decoder" className="hover:text-blue-600 transition-colors">VIN Decoder</Link>
            <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>

            {isAuthenticatedState && (
              <>
                {/* Messages - Available to all authenticated users */}
                <Link 
                  href="/messages" 
                  className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>

                {userRole === 'buyer' && (
                  <Link href="/my-requests" className="hover:text-blue-600 transition-colors">
                    My Requests
                  </Link>
                )}

                {userRole === 'seller' && (
                  <Link href="/seller/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard
                  </Link>
                )}

                {/* Admin Dashboard - Only for admin users */}
                {userRole === 'admin' && (
                  <Link 
                    href="/admin/dashboard" 
                    className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                  >
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
              <div className="flex items-center gap-2">
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : isAuthenticatedState ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <span className="text-sm text-gray-600">
                    Welcome, <span className="font-semibold">{userName}</span>
                  </span>
                  {userRole && (
                    <span className="block text-xs text-blue-600 capitalize">
                      ({userRole})
                    </span>
                  )}
                </div>

                {/* Role-based primary action button */}
                {userRole === 'buyer' ? (
                  <Link
                    href="/my-requests"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    My Requests
                  </Link>
                ) : userRole === 'seller' ? (
                  <Link
                    href="/seller/dashboard"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                  >
                    Seller Dashboard
                  </Link>
                ) : userRole === 'admin' ? (
                  <Link
                    href="/admin/dashboard"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-1 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Admin
                  </Link>
                ) : (
                  <Link
                    href="/request-part"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    Request Part
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded transition-colors font-medium"
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
                className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 transition-colors"
                title="Refresh Auth Status"
              >
                ↻ Auth
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden mt-4 border-t pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <Link href="/request-part" className="hover:text-blue-600 transition-colors">Request Part</Link>
            <Link href="/vin-decoder" className="hover:text-blue-600 transition-colors">VIN Decoder</Link>
            <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>

            {isAuthenticatedState && (
              <>
                <Link 
                  href="/messages" 
                  className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  Messages
                </Link>

                {userRole === 'buyer' && (
                  <Link href="/my-requests" className="hover:text-blue-600 transition-colors">
                    My Requests
                  </Link>
                )}
                {userRole === 'seller' && (
                  <Link href="/seller/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard
                  </Link>
                )}
                {userRole === 'admin' && (
                  <Link 
                    href="/admin/dashboard" 
                    className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                  >
                    <Users className="w-3 h-3" />
                    Admin
                  </Link>
                )}

                {/* Mobile user info */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Welcome, {userName}</span>
                  {userRole && (
                    <span className="capitalize">({userRole})</span>
                  )}
                </div>

                {/* Mobile logout */}
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 transition-colors"
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