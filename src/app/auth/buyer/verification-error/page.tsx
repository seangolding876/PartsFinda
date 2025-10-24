'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Mail } from 'lucide-react';

export default function BuyerVerificationError() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams) {
      setError(searchParams.get('error'));
      setIsLoading(false);
    }
  }, [searchParams]);

  const getErrorMessage = () => {
    switch (error) {
      case 'invalid_token':
        return 'The verification link is invalid. Please request a new verification email.';
      case 'invalid_or_expired':
        return 'This verification link has expired or is invalid. Please request a new one.';
      case 'server_error':
        return 'A server error occurred. Please try again later.';
      default:
        return 'An error occurred during email verification. Please try again.';
    }
  };

  const getErrorTitle = () => {
    switch (error) {
      case 'invalid_token':
        return 'Invalid Verification Link';
      case 'invalid_or_expired':
        return 'Link Expired';
      case 'server_error':
        return 'Server Error';
      default:
        return 'Verification Failed';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <AlertCircle className="w-16 h-16 text-red-600" />
          </div>
        </div>
        
        {/* Error Title */}
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
          {getErrorTitle()}
        </h1>
        
        {/* Error Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-center">
            {getErrorMessage()}
          </p>
        </div>

        {/* Solutions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            What you can do:
          </h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Check if you clicked the latest verification email</li>
            <li>• Request a new verification email from your account settings</li>
            <li>• Ensure you're using the same email you registered with</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link
            href="/auth/login"
            className="w-full border border-green-600 text-green-600 py-3 px-4 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            Go to Login
          </Link>
          
          <Link
            href="/contact"
            className="w-full border border-blue-600 text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
          >
            Contact Support
          </Link>
        </div>

        {/* Additional Help */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Still having trouble?{' '}
            <Link href="/help" className="text-green-600 hover:underline font-medium">
              Visit our help center
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}