'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/CartContext';

export default function Navigation() {
  const { getTotalItems } = useCart();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCartCount(getTotalItems());
    }, 100);
    return () => clearInterval(interval);
  }, [getTotalItems]);

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xl">
              Parts
            </div>
            <div className="text-blue-600 font-bold text-xl">
              Finda
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <Link href="/marketplace" className="hover:text-blue-600">Browse Parts</Link>
            <Link href="/request-part" className="hover:text-blue-600">Request Part</Link>
            <Link href="/visual-search" className="hover:text-blue-600">AI Search</Link>
            <Link href="/contact" className="hover:text-blue-600">Contact</Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Link href="/cart" className="relative hover:text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Links */}
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="text-gray-700 hover:text-blue-600">
                Login
              </Link>
              <Link href="/auth/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
