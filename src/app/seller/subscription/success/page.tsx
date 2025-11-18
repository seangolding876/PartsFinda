'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

export default function SubscriptionSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { successmsg, errormsg } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      // You can verify the session here if needed
      console.log('Payment successful for session:', sessionId);
      successmsg('Subscription activated successfully!');
      
      // Redirect after delay
      const timer = setTimeout(() => {
        router.push('/seller/dashboard');
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      errormsg('Invalid session');
      router.push('/seller/subscription');
    }
  }, [sessionId, successmsg, errormsg, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
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

        <div className="flex items-center justify-center text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Redirecting to dashboard...
        </div>
      </div>
    </div>
  );
}