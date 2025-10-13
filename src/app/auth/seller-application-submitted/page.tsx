'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, Mail, Clock, Phone, User, Building } from 'lucide-react';

// Main component jo suspense ke andar hoga
function ApplicationDetails() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
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

        {/* Success Card */}
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

          {/* Application Details */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Application Submitted
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-orange-600">Email Verification Pending</span>
              </div>
              
              <div className="text-sm text-gray-600 mt-4">
                <p>✅ We have sent a verification link to your email address.</p>
                <p>✅ Please check your inbox and click the verification link.</p>
                <p>✅ After verification, your application will be reviewed.</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              What Happens Next?
            </h3>
            
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-800">Check Your Email</p>
                  <p className="text-sm text-gray-600">
                    Look for verification email from PartFinda Jamaica
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-800">Verify Your Email</p>
                  <p className="text-sm text-gray-600">
                    Click the verification link in the email
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-800">Application Review</p>
                  <p className="text-sm text-gray-600">
                    Our team will review within 2-3 business days
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
              <User className="w-5 h-5" />
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

          {/* Action Buttons */}
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

// Loading component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-pulse">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense
export default function SellerApplicationSubmittedPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ApplicationDetails />
    </Suspense>
  );
}