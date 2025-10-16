'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Menu,
  X,
  MessageSquare,
  Settings,
  Users,
  Car,
  Crown,
  Bell,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { Dialog } from '@headlessui/react';

export default function Navigation() {
  const { user, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const handleUpgradeToPro = () => {
    window.open('/seller/subscription', '_blank');
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xl">
            PartsFinda
          </div>
          <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-semibold">
            Jamaica
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <Link href="/request-part" className="hover:text-blue-600 transition-colors">
            Request Part
          </Link>
          <Link href="/vin-decoder" className="hover:text-blue-600 transition-colors">
            VIN Decoder
          </Link>
          <Link href="/contact" className="hover:text-blue-600 transition-colors">
            Contact
          </Link>

          {user && (
            <>
              <Link
                href="/messages"
                className="hover:text-blue-600 flex items-center gap-1 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Messages
              </Link>

              {user.role === 'buyer' && (
                <Link href="/my-requests" className="hover:text-blue-600 transition-colors">
                  My Requests
                </Link>
              )}

              {user.role === 'seller' && (
                <>
                  <Link href="/seller/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard
                  </Link>
                  <button
                    onClick={handleUpgradeToPro}
                    className="hover:text-blue-600 flex items-center gap-1 transition-colors bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-sm font-medium"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Pro
                  </button>
                </>
              )}

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

        {/* Right Side (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          {isLoading ? (
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : user ? (
            <div className="flex items-center gap-4">
              {/* 🔔 Notification & Messages */}
              <div className="flex items-center gap-4">
                <NotificationBell />
                <Link
                  href="/messages"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>
              </div>

              {/* User Info */}
              <div className="text-right">
                <span className="text-sm text-gray-600">
                  Welcome, <span className="font-semibold">{user.name}</span>
                </span>
                <span className="block text-xs text-blue-600 capitalize">
                  ({user.role})
                </span>
              </div>

              {/* Logout */}
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-600 hover:text-blue-600"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* 📱 Mobile Drawer Menu */}
      <Dialog open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <Dialog.Panel className="fixed inset-y-0 left-0 w-80 bg-white p-6 overflow-y-auto shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-blue-600">PartsFinda Menu</h2>
            <button onClick={() => setMobileMenuOpen(false)}>
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="space-y-4">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block hover:text-blue-600">
              Home
            </Link>
            <Link href="/request-part" onClick={() => setMobileMenuOpen(false)} className="block hover:text-blue-600">
              Request Part
            </Link>
            <Link href="/vin-decoder" onClick={() => setMobileMenuOpen(false)} className="block hover:text-blue-600">
              VIN Decoder
            </Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block hover:text-blue-600">
              Contact
            </Link>

            {user && (
              <>
                {/* Notifications + Messages */}
                <div className="flex items-center gap-3 mt-4">
                  <NotificationBell />
                  <Link
                    href="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Messages
                  </Link>
                </div>

                {/* Role Specific */}
                {user.role === 'buyer' && (
                  <Link href="/my-requests" onClick={() => setMobileMenuOpen(false)} className="block hover:text-blue-600">
                    My Requests
                  </Link>
                )}

                {user.role === 'seller' && (
                  <>
                    <Link href="/seller/dashboard" onClick={() => setMobileMenuOpen(false)} className="block hover:text-blue-600">
                      Dashboard
                    </Link>
                    <button
                      onClick={handleUpgradeToPro}
                      className="w-full text-left mt-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-2 rounded-full text-sm font-medium"
                    >
                      <Crown className="inline w-4 h-4 mr-1" />
                      Upgrade to Pro
                    </button>
                  </>
                )}

                {/* 🧭 Admin Context Menu (Dummy Links) */}
                {user.role === 'admin' && (
                  <div className="mt-4 border-t pt-3 space-y-2">
                    <h3 className="text-gray-600 text-sm font-semibold uppercase">Admin Panel</h3>
                    <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 hover:text-blue-600">
                      <BarChart3 className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href="/admin/cars" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 hover:text-blue-600">
                      <Car className="w-4 h-4" /> Manage Cars
                    </Link>
                    <Link href="/admin/users" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 hover:text-blue-600">
                      <Users className="w-4 h-4" /> Manage Users
                    </Link>
                    <Link href="/admin/reports" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 hover:text-blue-600">
                      <ClipboardList className="w-4 h-4" /> Reports
                    </Link>
                    <Link href="/admin/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 hover:text-blue-600">
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                  </div>
                )}

                {/* User Info */}
                <div className="mt-6 text-sm text-gray-600">
                  <div>Welcome, <span className="font-semibold">{user.name}</span></div>
                  <div className="capitalize">({user.role})</div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium"
                >
                  Logout
                </button>
              </>
            )}

            {!user && (
              <div className="mt-4 space-y-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="block hover:text-blue-600">
                  Sign In
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="block hover:text-blue-600">
                  Sign Up
                </Link>
                <Link href="/auth/seller-register" onClick={() => setMobileMenuOpen(false)} className="block text-green-600 hover:text-green-700 font-semibold">
                  Become Supplier
                </Link>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </Dialog>
    </nav>
  );
}
