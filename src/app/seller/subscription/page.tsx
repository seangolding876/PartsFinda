'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

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

// ✅ MAIN SUBSCRIPTION COMPONENT - STRIPE CHECKOUT VERSION
export default function SubscriptionPage() {
  const router = useRouter();
  const { successmsg, infomsg, errormsg } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [couponCode, setCouponCode] = useState(''); // ✅ New coupon field

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
    const checkAuth = () => {
      const authData = getAuthData();
      
      if (!authData?.token) {
       // console.log('No token found, redirecting to login');
        errormsg('Please login to access subscription page');
        router.push('/auth/login');
        return false;
      }

      if (!isSeller()) {
      //  console.log('Not a seller, redirecting to home');
        errormsg('This page is for sellers only');
        router.push('/');
        return false;
      }

      return true;
    };

    if (checkAuth()) {
      setAuthChecked(true);
      fetchSubscriptionData();
    }
  }, [router, errormsg]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const authData = getAuthData();

      if (!authData?.token) {
        console.error('No auth token found');
        errormsg('Authentication token not found');
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
     // console.log('Plans loaded:', plansResult);

      if (plansResult.success) {
        setPlans(plansResult.data);
        infomsg('Subscription plans loaded successfully');
      } else {
        throw new Error(plansResult.error || 'Failed to load plans');
      }

      // Handle current subscription
      if (currentSubResponse.ok) {
        const currentSubResult = await currentSubResponse.json();
     //   console.log('Current subscription:', currentSubResult);
        
        if (currentSubResult.success && currentSubResult.data) {
          setCurrentSubscription(currentSubResult.data);
        }
      }

    } catch (error: any) {
      console.error('Error fetching subscription data:', error);
      errormsg(error.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Stripe Checkout Session for Subscriptions
  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (processing) return;

    try {
      setProcessing(true);
      setSelectedPlan(plan);
      const authData = getAuthData();
      
      if (!authData?.token) {
        errormsg('Please login again');
        router.push('/auth/login');
        return;
      }

    //  console.log('🔍 Selected plan:', plan);
      //console.log('🔍 Plan ID:', plan.id);

      // Check if this is the current plan
      if (currentSubscription?.plan_name === plan.name) {
        infomsg('You are already on this plan');
        return;
      }

     // console.log('Processing subscription for plan:', plan.name);

      // For FREE plan - direct activate (same as before)
      if (plan.price === 0) {
        infomsg('Activating free plan...');
        
        const response = await fetch('/api/subscription/activate-free', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.token}`
          },
          body: JSON.stringify({ planId: plan.id })
        });

        const result = await response.json();
        //console.log('Free plan activation result:', result);

        if (result.success) {
          successmsg('Free plan activated successfully!');
          setCurrentSubscription(result.data);
          fetchSubscriptionData();
        } else {
          throw new Error(result.error || 'Failed to activate free plan');
        }
        return;
      }

      // ✅ CHANGED: For PAID plans - Stripe Checkout Session (NEW APPROACH)
     // console.log('Creating Stripe checkout session for plan ID:', plan.id);
      infomsg('Redirecting to secure payment...');

      const checkoutResponse = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({ 
          planId: plan.id,
          couponCode: couponCode // Optional coupon
        })
      });

      const checkoutResult = await checkoutResponse.json();
     // console.log('Stripe checkout session result:', checkoutResult);

      if (checkoutResult.url) {
        // ✅ Redirect user to Stripe Checkout page
        successmsg('Redirecting to secure payment gateway...');
        window.location.href = checkoutResult.url;
      } else {
        throw new Error(checkoutResult.error || 'Failed to create checkout session');
      }

    } catch (error: any) {
      console.error('Subscription error:', error);
      errormsg(error.message || 'Failed to process subscription');
    } finally {
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  // ✅ REMOVED: All the old payment intent related functions
  // - handlePaymentSuccess
  // - handlePaymentCancel  
  // - StripeCheckoutForm component
  // - clientSecret state
  // - showStripeCheckout state
  // - paymentProcessing state

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-JM', {
      style: 'currency',
      currency: 'JMD'
    }).format(price);
  };

  const getPlanPeriod = (durationDays: number) => {
    if (durationDays === 30) return '/month';
    if (durationDays === 365) return '/year';
    return `/${durationDays} days`;
  };

  // ✅ New function to apply coupon
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      errormsg('Please enter a coupon code');
      return;
    }
    infomsg('Coupon applied! Discount will be reflected at checkout.');
    // Actual validation Stripe side hoga checkout session mein
  };

  // Show loading until auth is checked
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Checking authentication...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we verify your access</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading subscription plans...</p>
          <p className="text-sm text-gray-500 mt-2">Getting the latest pricing and features</p>
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
                  {plan.duration_days === 30 && (
                    <p className="text-sm text-gray-500 mt-1">Billed monthly</p>
                  )}
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
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center ${
                    currentSubscription?.plan_name === plan.name
                      ? 'bg-green-500 text-white cursor-default'
                      : plan.recommended
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : plan.name === 'free'
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processing && selectedPlan?.id === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Redirecting...
                    </>
                  ) : currentSubscription?.plan_name === plan.name ? (
                    'Current Plan'
                  ) : plan.price === 0 ? (
                    'Get Started Free'
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </button>

                {/* Secure Payment Note */}
                {plan.price > 0 && (
                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500">
                      🔒 Secure payment powered by Stripe
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ✅ REMOVED: Stripe Checkout Modal - Ab redirect hoga Stripe ki taraf */}

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
                  <td className="py-4 font-medium text-gray-700">Billing Cycle</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-4">
                      {plan.duration_days === 30 ? 'Monthly' : 
                       plan.duration_days === 365 ? 'Yearly' : 
                       `${plan.duration_days} days`}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">How Subscription Works</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Secure Payment</h4>
              <p>You'll be redirected to Stripe for secure payment processing</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Instant Activation</h4>
              <p>Your subscription activates immediately after successful payment</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Cancel Anytime</h4>
              <p>You can cancel your subscription anytime from your account</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}