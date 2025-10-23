'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Mail } from 'lucide-react';

export default function VerificationSuccess() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams) {
      setEmail(searchParams.get('email') || '');
      setIsLoading(false);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Email Verified Successfully! ✅
        </h1>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">
            <strong>Congratulations!</strong> Your email has been verified successfully.
          </p>
          {email && (
            <p className="text-green-700 text-sm mt-2">
              Verified email: <strong>{email}</strong>
            </p>
          )}
        </div>

        <div className="space-y-4 text-left bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-800 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            What happens next?
          </h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Your seller application is now under review</li>
            <li>• Management will verify your business details</li>
            <li>• You'll receive approval email within 1-2 business days</li>
            <li>• Then you can login and start receiving buyer requests</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors block"
          >
            Return to Homepage
          </Link>
          <p className="text-sm text-gray-600">
            Need help? <Link href="/contact" className="text-blue-600 hover:underline">Contact support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}