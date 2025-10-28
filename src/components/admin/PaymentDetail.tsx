'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentDetail {
  payment_id: number;
  stripe_payment_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
  receipt_url: string;
  customer_name: string;
  customer_email: string;
  invoice_number: string;
  payment_method: string;
  plan_details: any;
  user_id: number;
  user_name: string;
  user_email: string;
  business_name: string;
  phone: string;
  address: string;
  city: string;
  parish: string;
  postal_code: string;
  business_phone: string;
  business_email: string;
  business_registration_number: string;
  tax_id: string;
  plan_name: string;
  plan_price: number;
  duration_days: number;
  subscription_start: string;
  subscription_end: string;
  subscription_active: boolean;
}

interface PaymentDetailProps {
  paymentId: string;
}

export default function PaymentDetail({ paymentId }: PaymentDetailProps) {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchPaymentDetail();
  }, [paymentId]);

  const fetchPaymentDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/payments/${paymentId}`);
      const data = await response.json();

      if (data.success) {
        setPayment(data.data);
      } else {
        setError(data.error || 'Payment not found');
      }
    } catch (error) {
      console.error('Error fetching payment detail:', error);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReceipt = async () => {
    try {
      const response = await fetch('/api/admin/payments/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId: paymentId })
      });

      const data = await response.json();
      
      if (data.success) {
        router.push(data.data.receipt_url);
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      failed: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Failed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ {error || 'Payment not found'}</div>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Payments
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Payment Details</h1>
            <p className="text-gray-600 mt-2">
              Invoice: {payment.invoice_number || `INV-${payment.payment_id}`}
            </p>
          </div>
          
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <button
              onClick={handleGenerateReceipt}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Generate Receipt</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Payment Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Basic Details</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Payment ID</dt>
                      <dd className="text-sm text-gray-900 font-mono">{payment.stripe_payment_id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Internal ID</dt>
                      <dd className="text-sm text-gray-900">#{payment.payment_id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm">{getStatusBadge(payment.status)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(payment.created_at).toLocaleDateString()} at{' '}
                        {new Date(payment.created_at).toLocaleTimeString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Amount & Plan</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Amount</dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        ${payment.amount} {payment.currency}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Plan</dt>
                      <dd className="text-sm text-gray-900">{payment.plan_name || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Plan Price</dt>
                      <dd className="text-sm text-gray-900">${payment.plan_price || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Duration</dt>
                      <dd className="text-sm text-gray-900">{payment.duration_days || 'N/A'} days</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {payment.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                  <p className="text-sm text-gray-900">{payment.description}</p>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Personal Details</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="text-sm text-gray-900">{payment.user_name || payment.customer_name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{payment.user_email || payment.customer_email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="text-sm text-gray-900">{payment.phone || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Business Details</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Business Name</dt>
                      <dd className="text-sm text-gray-900">{payment.business_name || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Business Email</dt>
                      <dd className="text-sm text-gray-900">{payment.business_email || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Business Phone</dt>
                      <dd className="text-sm text-gray-900">{payment.business_phone || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tax ID</dt>
                      <dd className="text-sm text-gray-900">{payment.tax_id || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Address */}
              {(payment.address || payment.city || payment.parish) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Address</h3>
                  <p className="text-sm text-gray-900">
                    {[payment.address, payment.city, payment.parish, payment.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Status */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Status</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    payment.subscription_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {payment.subscription_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {payment.subscription_start && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Start Date</span>
                    <span className="text-sm text-gray-900">
                      {new Date(payment.subscription_start).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {payment.subscription_end && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">End Date</span>
                    <span className="text-sm text-gray-900">
                      {new Date(payment.subscription_end).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {payment.subscription_end && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Days Remaining</span>
                    <span className="text-sm text-gray-900">
                      {Math.ceil((new Date(payment.subscription_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleGenerateReceipt}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Receipt</span>
                </button>

                <button
                  onClick={() => router.push(`/admin/users/${payment.user_id}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>View Customer Profile</span>
                </button>

                {payment.user_email && (
                  <button
                    onClick={() => window.open(`mailto:${payment.user_email}`, '_blank')}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Send Email</span>
                  </button>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-6 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">CC</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {payment.payment_method || 'Credit Card'}
                  </p>
                  <p className="text-xs text-gray-500">Via Stripe</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}