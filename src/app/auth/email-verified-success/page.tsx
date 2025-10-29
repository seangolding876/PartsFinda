'use client';
import Link from 'next/link';
import { CheckCircle, Clock } from 'lucide-react';

export default function EmailVerifiedSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xl">
              PartsFinda
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
            Email Verified Successfully!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Your email has been verified. Your seller application is now under review.
          </p>

          <div className="bg-green-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              What Happens Next?
            </h3>
            
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <span className="text-green-700">Application under review by our team</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <span className="text-green-700">Approval decision within 2-3 business days</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <span className="text-green-700">You'll receive email notification once approved</span>
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