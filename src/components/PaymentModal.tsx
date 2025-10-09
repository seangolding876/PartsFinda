'use client';

import { useState } from 'react';
import { X, CreditCard, Loader } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'subscription' | 'urgent_request';
  plan?: string;
  priority?: string;
  amount: number;
  description: string;
  onSuccess: (paymentData: any) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  type,
  plan,
  priority,
  amount,
  description,
  onSuccess
}: PaymentModalProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  if (!isOpen) return null;

  const handleStripePayment = async () => {
    setProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          plan,
          priority,
          email: localStorage.getItem('userEmail') || 'user@example.com',
          amount
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.paymentIntent) {
          // Simulate successful payment
          setTimeout(() => {
            onSuccess({
              method: 'stripe',
              paymentIntentId: data.paymentIntent.id,
              amount: data.amount
            });
            onClose();
          }, 2000);
        } else {
          // No payment needed (free tier)
          onSuccess({ method: 'stripe', amount: 0 });
          onClose();
        }
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (err) {
      setError('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleStripePayment();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Complete Payment</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
              disabled={processing}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-2">{description}</p>
            <p className="text-3xl font-bold text-blue-600">
              JMD ${amount.toLocaleString()}
            </p>
          </div>

          {/* Stripe Payment Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay JMD ${amount.toLocaleString()}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span>🔒 Secure Payment</span>
              <span>Powered by Stripe</span>
              <span>256-bit Encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
