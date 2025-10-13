'use client';
import Link from 'next/link';
import { CheckCircle, Clock, Mail, Phone } from 'lucide-react';

export default function SellerApplicationSubmitted() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xl">
              PartFinda
            </div>
            <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-semibold">
              Jamaica
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Application Submitted Successfully!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Thank you for your interest in becoming a PartFinda Jamaica supplier.
          </p>

          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              What Happens Next?
            </h2>
            
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-800">Application Review</p>
                  <p className="text-sm text-gray-600">
                    Our team will review your application within 2-3 business days
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-800">Verification</p>
                  <p className="text-sm text-gray-600">
                    We'll verify your business details and contact information
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-800">Account Activation</p>
                  <p className="text-sm text-gray-600">
                    You'll receive an email with login details once approved
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Need Help?
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">support@partfinda.jm</span>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">+1 (876) 555-0100</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </Link>
            
            <Link
              href="/auth/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}