'use client';

import { useState, useEffect } from 'react';
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

export default function SubscriptionPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

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

      console.log('Fetching subscription data with token:', authData.token);

      // Fetch plans and current subscription in parallel
      const [plansResponse, currentSubResponse] = await Promise.all([
        fetch('/api/subscription/plans'),
        fetch('/api/subscription/current', {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        })
      ]);

      console.log('Plans response:', plansResponse.status);
      console.log('Current sub response:', currentSubResponse.status);

      if (!plansResponse.ok) {
        throw new Error(`Failed to fetch plans: ${plansResponse.status}`);
      }

      const plansResult = await plansResponse.json();
      console.log('Plans result:', plansResult);

      if (plansResult.success) {
        setPlans(plansResult.data);
      }

      // Handle current subscription (might return 404 if no subscription)
      if (currentSubResponse.ok) {
        const currentSubResult = await currentSubResponse.json();
        console.log('Current sub result:', currentSubResult);
        
        if (currentSubResult.success && currentSubResult.data) {
          setCurrentSubscription(currentSubResult.data);
          // Set selected plan to current plan
          const currentPlan = plansResult.data.find((p: SubscriptionPlan) => 
            p.name === currentSubResult.data.plan_name
          );
          setSelectedPlan(currentPlan?.id || null);
        }
      } else if (currentSubResponse.status !== 404) {
        console.error('Failed to fetch current subscription:', currentSubResponse.status);
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
      
      if (!authData?.token) {
        alert('Please login again');
        router.push('/auth/login');
        return;
      }

      const selectedPlanData = plans.find(p => p.id === planId);

      if (!selectedPlanData) {
        alert('Invalid plan selected');
        return;
      }

      // Check if this is the current plan
      if (currentSubscription?.plan_name === selectedPlanData.name) {
        alert('You are already on this plan');
        return;
      }

      console.log('Creating payment for plan:', selectedPlanData.name);

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
      console.log('Payment creation result:', paymentResult);

      if (!paymentResult.success) {
        throw new Error(paymentResult.error);
      }

      // For demo purposes - simulate payment
      console.log('Confirming payment...');
      const confirmResponse = await fetch('/api/subscription/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          paymentId: paymentResult.data.paymentId,
          transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          planId: planId
        })
      });

      const confirmResult = await confirmResponse.json();
      console.log('Payment confirmation result:', confirmResult);

      if (confirmResult.success) {
        alert('Subscription activated successfully!');
        setCurrentSubscription(confirmResult.data);
        // Refresh the data
        fetchSubscriptionData();
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
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={processing || (currentSubscription?.plan_name === plan.name)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    currentSubscription?.plan_name === plan.name
                      ? 'bg-green-500 text-white cursor-default'
                      : plan.recommended
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : plan.name === 'free'
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                  ) : plan.price === 0 ? (
                    'Get Started'
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

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