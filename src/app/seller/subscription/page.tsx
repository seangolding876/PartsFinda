'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

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

function SubscriptionPageContent() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Auth utility
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
    if (!isSeller()) {
      alert('This page is for sellers only');
      router.push('/auth/login');
      return;
    }
    fetchSubscriptionData();
  }, [router]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const authData = getAuthData();

      // Fetch plans and current subscription in parallel
      const [plansResponse, currentSubResponse] = await Promise.all([
        fetch('/api/subscription/plans'),
        fetch('/api/subscription/current', {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        })
      ]);

      const plansResult = await plansResponse.json();
      const currentSubResult = await currentSubResponse.json();

      if (plansResult.success) {
        setPlans(plansResult.data);
      }

      if (currentSubResult.success && currentSubResult.data) {
        setCurrentSubscription(currentSubResult.data);
        setSelectedPlan(
          plansResult.data.find((p: SubscriptionPlan) => 
            p.name === currentSubResult.data.plan_name
          )?.id || null
        );
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      alert('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: number) => {
    if (processing) return;

    try {
      setProcessing(true);
      const authData = getAuthData();
      const selectedPlanData = plans.find(p => p.id === planId);

      if (!selectedPlanData) {
        alert('Invalid plan selected');
        return;
      }

      // Create payment intent
      const paymentResponse = await fetch('/api/subscription/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          planId: planId,
          paymentMethod: 'stripe'
        })
      });

      const paymentResult = await paymentResponse.json();

      if (!paymentResult.success) {
        throw new Error(paymentResult.error);
      }

      // Here you would integrate with Stripe
      // For now, we'll simulate successful payment
      const confirmResponse = await fetch('/api/subscription/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          paymentId: paymentResult.data.paymentId,
          transactionId: `txn_${Date.now()}`,
          planId: planId
        })
      });

      const confirmResult = await confirmResponse.json();

      if (confirmResult.success) {
        alert('Subscription activated successfully!');
        setCurrentSubscription(confirmResult.data);
        router.refresh();
      } else {
        throw new Error(confirmResult.error);
      }

    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(error.message || 'Failed to process subscription');
    } finally {
      setProcessing(false);
    }
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
                  Current Plan: {currentSubscription.plan_name.toUpperCase()}
                </h3>
                <p className="text-blue-700">
                  Active until {new Date(currentSubscription.end_date).toLocaleDateString()}
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

        {/* Subscription Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                selectedPlan === plan.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : plan.recommended
                  ? 'border-green-500'
                  : 'border-gray-200'
              } ${plan.recommended ? 'relative transform scale-105' : ''}`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
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
                  
                  {/* Additional dynamic features based on plan */}
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      Request delay: {plan.request_delay_hours === 0 ? 'Instant' : `${plan.request_delay_hours} hours`}
                    </span>
                  </li>
                  
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      Duration: {plan.duration_days} days
                    </span>
                  </li>
                </ul>

                {/* Action Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={processing || (currentSubscription?.plan_name === plan.name)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    currentSubscription?.plan_name === plan.name
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : plan.recommended
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
                >
                  {processing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : currentSubscription?.plan_name === plan.name ? (
                    'Current Plan'
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Subscription Benefits</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">For All Plans</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Access to part requests in your area</li>
                <li>• Direct communication with buyers</li>
                <li>• Business profile listing</li>
                <li>• Basic analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Premium Features</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Early access to part requests</li>
                <li>• Priority in search results</li>
                <li>• Advanced analytics</li>
                <li>• Premium support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SubscriptionPageContent />
    </Suspense>
  );
}