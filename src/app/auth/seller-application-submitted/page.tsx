'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';


import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Mail, Clock, Shield } from 'lucide-react';

export default function SellerApplicationSubmitted() {
  const [applicationData, setApplicationData] = useState({
    applicationId: '',
    businessName: '',
    email: '',
    membershipPlan: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams) {
      setApplicationData({
        applicationId: searchParams.get('applicationId') || '',
        businessName: searchParams.get('businessName') || '',
        email: searchParams.get('email') || '',
        membershipPlan: searchParams.get('membershipPlan') || ''
      });
      setIsLoading(false);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
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
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Application Submitted Successfully!
          </h1>
          <p className="text-lg text-gray-600">
            Thank you for registering with PartsFinda
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Check Your Email</h3>
          </div>
          <p className="text-green-700 mb-2">
            We've sent a verification email to: <strong>{applicationData.email}</strong>
          </p>
          <p className="text-green-600 text-sm">
            Please click the verification link in the email to continue the process.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">What happens next?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Step 1:</strong> Verify your email address (check your inbox)</li>
                <li>• <strong>Step 2:</strong> Our team will review your application</li>
                <li>• <strong>Step 3:</strong> Get approved and start receiving buyer requests</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">Processing Time</h4>
              <p className="text-sm text-yellow-700">
                Application review typically takes 1-2 business days. You'll receive an email once your account is approved.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-600">Application ID:</span>
              <p className="text-gray-800">{applicationData.applicationId}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Business Name:</span>
              <p className="text-gray-800">{applicationData.businessName}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Membership Plan:</span>
              <p className="text-gray-800 capitalize">{applicationData.membershipPlan}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Contact Email:</span>
              <p className="text-gray-800">{applicationData.email}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            Return to Homepage
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Contact Support
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? <Link href="/contact" className="text-blue-600 hover:underline">Contact our support team</Link>
          </p>
        </div>
      </div>
    </div>
  );
}