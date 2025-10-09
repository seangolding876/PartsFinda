'use client';

import Link from 'next/link';
import { CheckCircle, Clock, Mail, Phone, FileText, ArrowRight, Home, MessageSquare } from 'lucide-react';

export default function SellerApplicationSubmittedPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Application Submitted Successfully!</h1>
            <p className="text-xl text-gray-600">
              Thank you for applying to become a verified supplier on PartFinda
            </p>
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">What Happens Next?</h2>

            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">1. Application Review</h3>
                <p className="text-sm text-gray-600">
                  Our team will review your application and verify your business information within 2-3 business days.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">2. Email Confirmation</h3>
                <p className="text-sm text-gray-600">
                  You'll receive an email with your application status and next steps if approved.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">3. Account Activation</h3>
                <p className="text-sm text-gray-600">
                  Once approved, your supplier account will be activated and you can start receiving requests.
                </p>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Application Details</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-sm text-gray-600">Application ID</p>
                <p className="font-semibold text-gray-800">SUP-{Date.now().toString().slice(-8)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Submitted On</p>
                <p className="font-semibold text-gray-800">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expected Response Time</p>
                <p className="font-semibold text-gray-800">2-3 Business Days</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-yellow-600">Under Review</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about your application or need assistance, please contact us:
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Mail className="w-5 h-5" />
                <span className="font-semibold">support@partfinda.com</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Phone className="w-5 h-5" />
                <span className="font-semibold">+876 219 3329</span>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Important Notes
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                Please ensure your email address is active as we'll send all communications there
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                Applications are processed Monday-Friday during business hours
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                Having business documents ready speeds up the verification process
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                You can track your application status by contacting our support team
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Return to Homepage
            </Link>

            <Link
              href="/contact"
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Contact Support
            </Link>
          </div>

          {/* Footer Message */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Thank you for choosing PartFinda. We look forward to having you as part of Jamaica's premier car parts marketplace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
