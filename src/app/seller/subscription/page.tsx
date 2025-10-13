'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import stripePromise from '@/lib/stripe-client';

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  request_delay_hours: number;
  features: Array<{
    feature_id: number;
    feature_text: string;
  }>;
  recommended?: boolean;
}

// Stripe Payment Form Component
function CheckoutForm({ 
  plan, 
  onSuccess, 
  onCancel 
}: { 
  plan: SubscriptionPlan;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/seller/subscription/success`,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Complete Your Subscription</h3>
        <p className="text-gray-600 mb-4">
          You are subscribing to: <strong>{plan.name}</strong> - ${plan.price}
        </p>
        
        <form onSubmit={handleSubmit}>
          <PaymentElement />
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
              {error}
            </div>
          )}
          
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || loading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </span>
              ) : (
                `Pay $${plan.price}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Subscription Component
function SubscriptionPageContent() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const getAuthData = () => {
    if (typeof window === 'undefined') return null;
    try {
      const authData = localStorage.getItem('authData');
      return authData ? JSON.parse(authData) : null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const authData = getAuthData();
    if (!authData?.token || authData.role !== 'seller') {
      router.push('/auth/login');
      return;
    }
    fetchSubscriptionData();
  }, [router]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const authData = getAuthData();

      const [plansResponse, currentSubResponse] = await Promise.all([
        fetch('/api/subscription/plans'),
        fetch('/api/subscription/current', {
          headers: { 'Authorization': `Bearer ${authData.token}` }
        })
      ]);

      const plansResult = await plansResponse.json();
      if (plansResult.success) setPlans(plansResult.data);

      if (currentSubResponse.ok) {
        const currentSubResult = await currentSubResponse.json();
        if (currentSubResult.success) setCurrentSubscription(currentSubResult.data);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (processing) return;

    try {
      setProcessing(true);
      const authData = getAuthData();

      if (currentSubscription?.plan_name === plan.name) {
        alert('You are already on this plan');
        return;
      }

      // For free plan
      if (plan.price === 0) {
        const response = await fetch('/api/subscription/activate-free', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.token}`
          },
          body: JSON.stringify({ planId: plan.id })
        });

        const result = await response.json();
        if (result.success) {
          alert('Free plan activated!');
          fetchSubscriptionData();
        } else {
          throw new Error(result.error);
        }
        return;
      }

      // For paid plans - create payment intent
      const paymentResponse = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({ planId: plan.id })
      });

      const paymentResult = await paymentResponse.json();

      if (paymentResult.clientSecret) {
        setSelectedPlan(plan);
        setClientSecret(paymentResult.clientSecret);
        setShowCheckout(true);
      } else {
        throw new Error(paymentResult.error || 'Failed to create payment');
      }

    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(error.message || 'Failed to process subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!selectedPlan) return;

    try {
      const authData = getAuthData();
      
      // Confirm payment and activate subscription
      const response = await fetch('/api/stripe/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({ 
          planId: selectedPlan.id,
          paymentIntentId: clientSecret.split('_secret')[0]
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Subscription activated successfully!');
        setShowCheckout(false);
        setSelectedPlan(null);
        setClientSecret('');
        fetchSubscriptionData();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to activate subscription');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header and plans grid - same as before */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-2xl shadow-lg border-2 p-8">
              {/* Plan details */}
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={processing}
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {plan.price === 0 ? 'Get Started' : `Subscribe - ${formatPrice(plan.price)}`}
              </button>
            </div>
          ))}
        </div>

        {/* Stripe Checkout Modal */}
        {showCheckout && clientSecret && selectedPlan && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm
              plan={selectedPlan}
              onSuccess={handlePaymentSuccess}
              onCancel={() => {
                setShowCheckout(false);
                setSelectedPlan(null);
                setClientSecret('');
              }}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return <SubscriptionPageContent />;
}