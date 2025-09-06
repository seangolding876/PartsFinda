import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from '@/lib/CartContext';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PartsFinda - Jamaica's Auto Parts Marketplace",
  description: "Find quality auto parts from trusted sellers across Jamaica. Request parts and get competitive quotes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <Navigation />
          {children}
          <footer className="bg-gray-900 text-white py-12 mt-20">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">PartsFinda</h3>
                  <p className="text-gray-400">Jamaica's trusted marketplace for auto parts. Connect with verified sellers across the island.</p>
                  <div className="flex gap-3 mt-4">
                    <a href="#" className="text-2xl hover:text-blue-400">📘</a>
                    <a href="#" className="text-2xl hover:text-blue-400">🐦</a>
                    <a href="#" className="text-2xl hover:text-blue-400">📷</a>
                    <a href="#" className="text-2xl hover:text-blue-400">💼</a>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Quick Links</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li><a href="/marketplace" className="hover:text-white">Browse Parts</a></li>
                    <li><a href="/request-part" className="hover:text-white">Request a Part</a></li>
                    <li><a href="/auth/seller-signup" className="hover:text-white">Become a Seller</a></li>
                    <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
                    <li><a href="/about" className="hover:text-white">About Us</a></li>
                    <li><a href="/faq" className="hover:text-white">FAQ</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Contact Info</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li>📞 1-876-219-3329</li>
                    <li>📧 partsfinda@gmail.com</li>
                    <li>📍 Kingston, Jamaica</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">For Sellers</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li><a href="/auth/seller-signup" className="hover:text-white">Register as Seller</a></li>
                    <li><a href="/seller/dashboard" className="hover:text-white">Seller Dashboard</a></li>
                    <li><a href="/seller/subscription" className="hover:text-white">Subscription Plans</a></li>
                    <li className="pt-3">
                      <a href="/auth/seller-signup" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block">
                        Start Selling
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                <p>&copy; 2024 PartsFinda Inc. All rights reserved. |
                  <a href="/privacy" className="hover:text-white"> Privacy Policy</a> |
                  <a href="/terms" className="hover:text-white"> Terms of Service</a> |
                  <a href="/returns" className="hover:text-white"> Returns</a>
                </p>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
