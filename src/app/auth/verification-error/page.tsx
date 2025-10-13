'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Inner component that uses useSearchParams
function VerificationErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

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
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Verification Failed
          </h1>

          <p className="text-lg text-gray-600 mb-4">
            {error || 'The verification link is invalid or has expired.'}
          </p>

          <div className="bg-yellow-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5" />
              What to do next?
            </h3>
            
            <div className="space-y-2 text-left">
              <p className="text-yellow-700">• Request a new verification link from your account settings</p>
              <p className="text-yellow-700">• Check if the link has expired (valid for 24 hours only)</p>
              <p className="text-yellow-700">• Contact support if you continue experiencing issues</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go to Login
            </Link>
            
            <Link
              href="/auth/seller-signup"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Sign Up Again
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
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense
export default function VerificationErrorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerificationErrorContent />
    </Suspense>
  );
}