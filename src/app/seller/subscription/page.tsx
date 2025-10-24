'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';

// Stripe promise initialize karen
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);


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

interface CurrentSubscription {
  id: number;
  plan_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  price: number;
  duration_days: number;
}

// Stripe Checkout Form Component
function StripeCheckoutForm({ 
  plan, 
  clientSecret, 
  onSuccess, 
  onCancel 
}: { 
  plan: SubscriptionPlan;
  clientSecret: string;
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
      // const { error: stripeError } = await stripe.confirmPayment({
      //   elements,
      //   confirmParams: {
      //     return_url: `${window.location.origin}/seller/subscription/success`,
      //   },
      //   redirect: 'if_required',
      // });

      // if (stripeError) {
      //   setError(stripeError.message || 'Payment failed. Please try again.');
      // } else {
      //   // Payment successful
      //   onSuccess();
      // }

      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
  elements,
  confirmParams: { return_url: window.location.origin + '/seller/subscription/success' },
  redirect: 'if_required',
});

if (stripeError) {
  console.error('Stripe Error:', stripeError);
  alert(`Payment failed: ${stripeError.message}`);
  setError(stripeError.message || 'Payment failed. Please try again.');
} else {
  onSuccess();
  console.log('Payment successful:', paymentIntent);
}

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">Complete Payment</h3>
          <p className="text-gray-600 mt-2">
            Subscribe to <span className="font-semibold capitalize">{plan.name}</span> plan
          </p>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total Amount:</span>
              <span className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(plan.price)}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <PaymentElement 
              options={{
                layout: 'tabs'
              }}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || loading}
              className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(plan.price)}`
              )}
            </button>
          </div>
        </form>

        <div className="px-6 pb-6">
          <div className="text-center text-xs text-gray-500">
            <p>Secure payment powered by Stripe</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Subscription Component
export default function SubscriptionPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);

  // Auth utility - pure localStorage based
  const getAuthData = () => {
    if (typeof window === 'undefined') return null;
    try {
      const authData = localStorage.getItem('authData');
      return authData ? JSON.parse(authData) : null;
    } catch (error) {
      return null;
    }
  };

  const isSeller = () => {
    const authData = getAuthData();
    return authData?.role === 'seller';
  };

  useEffect(() => {
    // Check authentication on component mount
    const checkAuth = () => {
      const authData = getAuthData();
      
      if (!authData?.token) {
        console.log('No token found, redirecting to login');
        alert('Please login to access subscription page');
        router.push('/auth/login');
        return false;
      }

      if (!isSeller()) {
        console.log('Not a seller, redirecting to home');
        alert('This page is for sellers only');
        router.push('/');
        return false;
      }

      return true;
    };

    if (checkAuth()) {
      setAuthChecked(true);
      fetchSubscriptionData();
    }
  }, [router]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const authData = getAuthData();

      if (!authData?.token) {
        console.error('No auth token found');
        return;
      }

      // Fetch plans and current subscription in parallel
      const [plansResponse, currentSubResponse] = await Promise.all([
        fetch('/api/subscription/plans'),
        fetch('/api/subscription/current', {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        })
      ]);

      if (!plansResponse.ok) {
        throw new Error(`Failed to fetch plans: ${plansResponse.status}`);
      }

      const plansResult = await plansResponse.json();
      console.log('Plans loaded:', plansResult);

      if (plansResult.success) {
        setPlans(plansResult.data);
      }

      // Handle current subscription
      if (currentSubResponse.ok) {
        const currentSubResult = await currentSubResponse.json();
        console.log('Current subscription:', currentSubResult);
        
        if (currentSubResult.success && currentSubResult.data) {
          setCurrentSubscription(currentSubResult.data);
        }
      }

    } catch (error) {
      console.error('Error fetching subscription data:', error);
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
      
      if (!authData?.token) {
        alert('Please login again');
        router.push('/auth/login');
        return;
      }

        console.log('🔍 Selected plan:', plan); // ✅ Debug log
    console.log('🔍 Plan ID:', plan.id); // ✅ Debug log


      // Check if this is the current plan
      if (currentSubscription?.plan_name === plan.name) {
        alert('You are already on this plan');
        return;
      }

      console.log('Processing subscription for plan:', plan.name);

       // For FREE plan - direct activate
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
      console.log('Free plan activation result:', result);

      if (result.success) {
        alert('Free plan activated successfully!');
        setCurrentSubscription(result.data);
        fetchSubscriptionData();
      } else {
        throw new Error(result.error || 'Failed to activate free plan');
      }
      return;
    }

    // For PAID plans - Stripe payment
    console.log('Creating Stripe payment intent for plan ID:', plan.id);

    const paymentResponse = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.token}`
      },
      body: JSON.stringify({ 
        planId: plan.id  // ✅ Make sure this is correct
      })
    });

    const paymentResult = await paymentResponse.json();
    console.log('Stripe payment intent result:', paymentResult);

    // Check if clientSecret properly mil raha hai
    if (paymentResult.clientSecret) {
      setSelectedPlan(plan);
      setClientSecret(paymentResult.clientSecret);
      setShowStripeCheckout(true);
    } else {
      console.error('No clientSecret received:', paymentResult);
      throw new Error(paymentResult.error || 'Failed to create payment. Please try again.');
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
      
      // Extract payment intent ID from client secret
      const paymentIntentId = clientSecret.split('_secret')[0];
      
      console.log('Confirming payment with ID:', paymentIntentId);

      // Confirm payment and activate subscription
      const response = await fetch('/api/stripe/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({ 
          planId: selectedPlan.id,
          paymentIntentId: paymentIntentId
        })
      });

      const result = await response.json();
      console.log('Payment confirmation result:', result);

      if (result.success) {
        alert('🎉 Subscription activated successfully!');
        setShowStripeCheckout(false);
        setSelectedPlan(null);
        setClientSecret('');
        setCurrentSubscription(result.data);
        fetchSubscriptionData();
      } else {
        throw new Error(result.error || 'Payment confirmation failed');
      }
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      alert(error.message || 'Failed to activate subscription');
    }
  };

  const handlePaymentCancel = () => {
    setShowStripeCheckout(false);
    setSelectedPlan(null);
    setClientSecret('');
    setProcessing(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getPlanPeriod = (durationDays: number) => {
    if (durationDays === 30) return '/month';
    if (durationDays === 365) return '/year';
    return `/${durationDays} days`;
  };

  // Show loading until auth is checked
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Subscription Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upgrade your seller account to get more visibility, faster response times, and premium features.
          </p>
        </div>

        {/* Current Subscription Banner */}
        {currentSubscription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Current Plan: <span className="capitalize">{currentSubscription.plan_name}</span>
                </h3>
                <p className="text-blue-700">
                  Active until {new Date(currentSubscription.end_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  You can upgrade or change your plan at any time
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>
            </div>
          </div>
        )}

        {/* No Subscription Banner */}
        {!currentSubscription && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No Active Subscription
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You are currently on the free plan. Upgrade to get early access to part requests and premium features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                currentSubscription?.plan_name === plan.name
                  ? 'border-green-500 ring-2 ring-green-200'
                  : plan.recommended
                  ? 'border-blue-500'
                  : 'border-gray-200'
              } ${plan.recommended ? 'relative transform scale-105' : ''}`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-green-600">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-lg text-gray-500">
                      {getPlanPeriod(plan.duration_days)}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature.feature_id} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature.feature_text}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={processing || (currentSubscription?.plan_name === plan.name)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    currentSubscription?.plan_name === plan.name
                      ? 'bg-green-500 text-white cursor-default'
                      : plan.recommended
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : plan.name === 'free'
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                >
                  {processing && selectedPlan?.id === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : currentSubscription?.plan_name === plan.name ? (
                    'Current Plan'
                  ) : plan.price === 0 ? (
                    'Get Started Free'
                  ) : (
                    `Subscribe Now`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Stripe Checkout Modal */}
        {showStripeCheckout && clientSecret && selectedPlan && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripeCheckoutForm
              plan={selectedPlan}
              clientSecret={clientSecret}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </Elements>
        )}

        {/* Features Comparison Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Plan Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left pb-4 font-semibold text-gray-900">Feature</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center pb-4 font-semibold text-gray-900">
                      {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 font-medium text-gray-700">Request Access Delay</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-4">
                      {plan.request_delay_hours === 0 ? 'Instant' : `${plan.request_delay_hours} hours`}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 font-medium text-gray-700">Price</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-4">
                      {formatPrice(plan.price)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 font-medium text-gray-700">Duration</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-4">
                      {plan.duration_days} days
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}