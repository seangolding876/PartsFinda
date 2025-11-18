'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { successmsg, errormsg } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        errormsg('Invalid session');
        router.push('/seller/subscription');
        return;
      }

      try {
        console.log('Verifying payment for session:', sessionId);
        
        // You can add session verification here if needed
        // const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
        // const result = await response.json();
        
        successmsg('Subscription activated successfully!');
        setVerified(true);
        
        // Auto-redirect after delay
        const timer = setTimeout(() => {
          router.push('/seller/dashboard');
        }, 5000);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Verification error:', error);
        errormsg('Payment verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, successmsg, errormsg, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {verified ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Successful! 🎉
            </h1>
            
            <p className="text-gray-600 mb-6">
              Thank you for your subscription. Your payment has been processed successfully and your account has been upgraded.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                A confirmation email has been sent to your registered email address.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/seller/dashboard')}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </button>
              
              <button
                onClick={() => router.push('/seller/subscription')}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Plans
              </button>
            </div>

            <div className="flex items-center justify-center text-sm text-gray-500 mt-4">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Redirecting to dashboard in 5 seconds...
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Verification Failed
            </h1>
            
            <p className="text-gray-600 mb-6">
              We couldn't verify your payment. Please check your email for confirmation or contact support.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/seller/subscription')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              
              <button
                onClick={() => router.push('/seller/dashboard')}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}