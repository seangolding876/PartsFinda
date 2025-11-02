'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ReceiptData {
  invoice_number: string;
  date: string;
  customer: {
    name: string;
    email: string;
    business: string;
    address: string;
    city: string;
    parish: string;
    postal_code: string;
    phone: string;
  };
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    description: string;
  };
  subscription: {
    plan_name: string;
    price: number;
    duration_days: number;
  };
  breakdown: {
    subtotal: number;
    tax: number;
    total: number;
  };
}

interface ReceiptPageProps {
  paymentId: string;
}

export default function ReceiptPage({ paymentId }: ReceiptPageProps) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (paymentId) {
      generateReceipt();
    }
  }, [paymentId]);

  const generateReceipt = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate receipt');
      }

      const data = await response.json();

      if (data.success) {
        setReceipt(data.data.receipt);
      } else {
        setError(data.error || 'Failed to generate receipt');
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      setError('Failed to generate receipt');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    // Yahan aap PDF generation service integrate kar sakte hain
    // For now, print dialog show karenge
    handlePrint();
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ {error || 'Receipt not found'}</div>
          <button
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Rest of the component remains the same as before...
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6 print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <button
                onClick={handleBack}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Payment
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Payment Receipt</h1>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Receipt</span>
              </button>
              
              <button
                onClick={handleDownloadPDF}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Receipt */}
        <div ref={receiptRef} className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 print:shadow-none print:border-none">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-300 pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
              <p className="text-gray-600 mt-2">AutoParts Marketplace</p>
            </div>
            
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">
                #{receipt.invoice_number}
              </p>
              <p className="text-gray-600">
                Date: {new Date(receipt.date).toLocaleDateString()}
              </p>
              <p className="text-gray-600">
                Time: {new Date(receipt.date).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Company and Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">From</h3>
              <p className="font-semibold text-gray-900">AutoParts Marketplace</p>
              <p className="text-gray-600">123 Business Street</p>
              <p className="text-gray-600">Kingston, Jamaica</p>
              <p className="text-gray-600">contact@autoparts.com</p>
              <p className="text-gray-600">+1 (876) 123-4567</p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
              <p className="font-semibold text-gray-900">{receipt.customer.name}</p>
              {receipt.customer.business && (
                <p className="text-gray-600">{receipt.customer.business}</p>
              )}
              {receipt.customer.address && (
                <p className="text-gray-600">{receipt.customer.address}</p>
              )}
              <p className="text-gray-600">
                {[receipt.customer.city, receipt.customer.parish, receipt.customer.postal_code]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p className="text-gray-600">{receipt.customer.email}</p>
              {receipt.customer.phone && (
                <p className="text-gray-600">{receipt.customer.phone}</p>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="border border-gray-200 rounded-lg mb-6">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Payment ID:</span>
                  <span className="ml-2 text-gray-900 font-mono">{receipt.payment.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    receipt.payment.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {receipt.payment.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Payment Method:</span>
                  <span className="ml-2 text-gray-900">{receipt.payment.method || 'Credit Card'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Currency:</span>
                  <span className="ml-2 text-gray-900">{receipt.payment.currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="border border-gray-200 rounded-lg mb-6">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Subscription Plan</h3>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-900">{receipt.subscription.plan_name} Plan</h4>
                  <p className="text-sm text-gray-600">
                    Duration: {receipt.subscription.duration_days} days
                  </p>
                  {receipt.payment.description && (
                    <p className="text-sm text-gray-600 mt-1">{receipt.payment.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${receipt.subscription.price}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Amount Breakdown</h3>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">${receipt.breakdown.subtotal}</span>
                </div>
                
                {receipt.breakdown.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="text-gray-900">${receipt.breakdown.tax}</span>
                  </div>
                )}
                
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${receipt.breakdown.total} {receipt.payment.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              Thank you for your business! This is an official receipt for your subscription payment.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              If you have any questions, please contact us at support@autoparts.com
            </p>
            <div className="mt-4 flex justify-center space-x-6 text-xs text-gray-500">
              <span>Payment Processed via Stripe</span>
              <span>•</span>
              <span>AutoParts Marketplace</span>
              <span>•</span>
              <span>{new Date().getFullYear()}</span>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body {
              background: white !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:shadow-none {
              box-shadow: none !important;
            }
            .print\\:border-none {
              border: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}