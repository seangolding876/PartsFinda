'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Settings, Users, Car, Crown } from 'lucide-react';

export default function Navigation() {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleUpgradeToPro = () => {
    // Subscription page ko open karega
    window.open('/seller/subscription', '_blank');
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

            {user && (
              <>
                {/* Messages - Available to all authenticated users */}
                <Link 
                  href="/messages" 
                  className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>

                {user.role === 'buyer' && (
                  <>
                    <Link href="/my-requests" className="hover:text-blue-600 transition-colors">
                      My Requests
                    </Link>
                    
                  
                  </>
                )}

                {user.role === 'seller' && (
                  <> 
                       <Link href="/seller/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard
                  </Link>
                    {/* Upgrade to Pro Button - Only for buyer */}
                    <button
                      onClick={handleUpgradeToPro}
                      className="hover:text-blue-600 flex items-center gap-1 transition-colors bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-sm font-medium"
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade to Pro
                    </button>
                  </>
             
                )}

                {/* Admin Dashboard - Only for admin users */}
                {user.role === 'admin' && (
                  <>
                    <Link 
                      href="/admin/dashboard" 
                      className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      Admin
                    </Link>
                    <Link 
                      href="/admin/cars" 
                      className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                    >
                      <Car className="w-4 h-4" />
                      Manage Cars
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <span className="text-sm text-gray-600">
                    Welcome, <span className="font-semibold">{user.name}</span>
                  </span>
                  <span className="block text-xs text-blue-600 capitalize">
                    ({user.role})
                  </span>
                </div>

                {/* Role-based primary action button */}
                {user.role === 'buyer' ? (
                  <></>
                ) : user.role === 'seller' ? (
                  <Link
                    href="/seller/dashboard"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                  >
                    Seller Dashboard
                  </Link>
                ) : user.role === 'admin' ? (
                  <Link
                    href="/admin/dashboard"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-1 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Admin
                  </Link>
                ) : null}

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
                    href="/auth/seller-register"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Become Supplier
                  </Link>
                </div>
              </div>
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

            {user && (
              <>
                <Link 
                  href="/messages" 
                  className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  Messages
                </Link>

                {user.role === 'buyer' && (
                  <>
                    <Link href="/my-requests" className="hover:text-blue-600 transition-colors">
                      My Requests
                    </Link>
                    
            
                  </>
                )}
                {user.role === 'seller' && (
                  <>
                  <Link href="/seller/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard
                  </Link>
                          {/* Mobile Upgrade to Pro Button */}
                    <button
                      onClick={handleUpgradeToPro}
                      className="hover:text-blue-600 flex items-center gap-1 transition-colors bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-2 py-1 rounded-full text-xs font-medium"
                    >
                      <Crown className="w-3 h-3" />
                      Upgrade Pro
                    </button>
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link 
                      href="/admin/dashboard" 
                      className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                    >
                      <Users className="w-3 h-3" />
                      Admin
                    </Link>
                    <Link 
                      href="/admin/cars" 
                      className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                    >
                      <Car className="w-3 h-3" />
                      Cars
                    </Link>
                  </>
                )}

                {/* Mobile user info */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Welcome, {user.name}</span>
                  <span className="capitalize">({user.role})</span>
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