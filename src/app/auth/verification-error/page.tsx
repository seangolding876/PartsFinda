'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function VerificationError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'invalid_token':
        return 'Invalid verification link. Please request a new verification email.';
      case 'invalid_or_expired':
        return 'This verification link has expired or is invalid. Please request a new one.';
      case 'server_error':
        return 'Server error occurred. Please try again later.';
      default:
        return 'An error occurred during email verification. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Verification Failed
        </h1>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">
            {getErrorMessage()}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/contact"
            className="w-full border border-blue-600 text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors block"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}