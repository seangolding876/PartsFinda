import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from '@/components/Navigation';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PartsFinda - Jamaica's Auto Parts Request System",
  description: "Request auto parts and get competitive quotes from verified sellers across Jamaica.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* ✅ Navigation ko AuthProvider ke ANDAR rakhein */}
        <AuthProvider>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>

        {/* Footer AuthProvider ke bahar bhi ho sakta hai */}
        <footer className="bg-gray-900 text-white py-12 mt-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">PartsFinda</h3>
                <p className="text-gray-400">Jamaica's trusted auto parts request system. Get quotes from verified sellers across the island.</p>
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
                  <li><a href="/request-part" className="hover:text-white">Request a Part</a></li>
                  <li><a href="/my-requests" className="hover:text-white">My Requests</a></li>
                  <li><a href="/vin-decoder" className="hover:text-white">VIN Decoder</a></li>
                  <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
                  <li><a href="/about" className="hover:text-white">About Us</a></li>
                  <li><a href="/faq" className="hover:text-white">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Contact Info</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>📞 1-876-219-3329</li>
                  <li>📧 support@partsfinda.com</li>
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
      </body>
    </html>
  );
}