'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SellerSubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState('');

  const subscriptionPlans = [
    {
      name: 'Basic',
      id: 'basic',
      monthlyPrice: 0,
      yearlyPrice: 0,
      color: 'gray',
      badge: '',
      features: [
        '✅ List up to 10 parts',
        '✅ Basic seller profile',
        '✅ Standard search ranking',
        '⏰ Part requests after 24-48 hours',
        '❌ No featured listings',
        '❌ No priority support',
        '❌ No analytics dashboard',
        '❌ No bulk upload',
        '5% commission on sales'
      ],
      limitations: [
        'Limited visibility',
        'Delayed notifications',
        'Basic features only'
      ]
    },
    {
      name: 'Silver',
      id: 'silver',
      monthlyPrice: 2999,
      yearlyPrice: 29990,
      color: 'blue',
      badge: 'POPULAR',
      features: [
        '✅ List up to 50 parts',
        '✅ Enhanced seller profile with badges',
        '✅ Better search ranking',
        '🔥 Instant urgent part request notifications',
        '✅ 2 featured listings per month',
        '✅ Basic analytics dashboard',
        '✅ Priority email support',
        '✅ Bulk upload (up to 20 items)',
        '✅ Seller verification badge',
        '4% commission on sales'
      ],
      limitations: []
    },
    {
      name: 'Gold',
      id: 'gold',
      monthlyPrice: 5999,
      yearlyPrice: 59990,
      color: 'yellow',
      badge: 'BEST VALUE',
      features: [
        '✅ List up to 200 parts',
        '✅ Premium seller profile with custom branding',
        '✅ Top search ranking priority',
        '⚡ Instant ALL part request notifications',
        '✅ 10 featured listings per month',
        '✅ Advanced analytics & insights',
        '✅ 24/7 priority phone support',
        '✅ Unlimited bulk upload',
        '✅ Gold verification badge',
        '✅ Custom store URL',
        '✅ Promotional tools',
        '3% commission on sales'
      ],
      limitations: []
    },
    {
      name: 'Platinum',
      id: 'platinum',
      monthlyPrice: 14999,
      yearlyPrice: 149990,
      color: 'purple',
      badge: 'ENTERPRISE',
      features: [
        '✅ Unlimited part listings',
        '✅ Full custom storefront',
        '✅ Guaranteed top search placement',
        '⚡ First priority on ALL requests',
        '✅ Unlimited featured listings',
        '✅ Real-time analytics & API access',
        '✅ Dedicated account manager',
        '✅ Custom integration support',
        '✅ Platinum badge & verification',
        '✅ Marketing campaign support',
        '✅ Exclusive seller events',
        '✅ Free professional photography',
        '2% commission on sales',
        '✅ Custom payment terms'
      ],
      limitations: []
    }
  ];

  const additionalRevenue = [
    {
      title: 'Featured Listings',
      description: 'Boost individual parts to top of search',
      pricing: '$500 JMD per part per week'
    },
    {
      title: 'Homepage Banner Ads',
      description: 'Premium advertising space on homepage',
      pricing: '$25,000 JMD per month'
    },
    {
      title: 'Category Sponsorship',
      description: 'Be the exclusive featured seller in a category',
      pricing: '$15,000 JMD per month'
    },
    {
      title: 'Email Marketing',
      description: 'Include your parts in our weekly newsletter',
      pricing: '$5,000 JMD per campaign'
    },
    {
      title: 'Express Verification',
      description: 'Fast-track seller verification process',
      pricing: '$2,500 JMD one-time'
    }
  ];

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const yearlyCostIfMonthly = monthlyPrice * 12;
    const savings = yearlyCostIfMonthly - yearlyPrice;
    const percentSaved = monthlyPrice > 0 ? Math.round((savings / yearlyCostIfMonthly) * 100) : 0;
    return { savings, percentSaved };
  };

  const handleSubscribe = (planId: string) => {
    setSelectedPlan(planId);
    // In production, this would integrate with payment gateway
    alert(`Redirecting to payment for ${planId} plan (${billingCycle})`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-700 to-teal-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Seller Subscription Plans</h1>
          <p className="text-xl mb-8">Join Jamaica's fastest-growing auto parts marketplace</p>
          <div className="inline-flex items-center gap-6 bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
            <div>
              <div className="text-3xl font-bold">5,000+</div>
              <div className="text-sm">Active Sellers</div>
            </div>
            <div className="w-px h-12 bg-white/30"></div>
            <div>
              <div className="text-3xl font-bold">$2.5M+</div>
              <div className="text-sm">Monthly Sales</div>
            </div>
            <div className="w-px h-12 bg-white/30"></div>
            <div>
              <div className="text-3xl font-bold">50,000+</div>
              <div className="text-sm">Part Requests/Month</div>
            </div>
          </div>
        </div>
      </section>

      {/* Billing Toggle */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border-2 border-gray-200 p-1 bg-white">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Yearly Billing (Save up to 17%)
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {subscriptionPlans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const { percentSaved } = calculateSavings(plan.monthlyPrice, plan.yearlyPrice);

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-lg shadow-lg overflow-hidden transform transition hover:scale-105 ${
                  plan.name === 'Gold' ? 'ring-4 ring-yellow-400' : ''
                }`}
              >
                {plan.badge && (
                  <div className={`text-center py-2 text-white text-sm font-bold ${
                    plan.badge === 'BEST VALUE' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    plan.badge === 'POPULAR' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    'bg-gradient-to-r from-purple-600 to-pink-600'
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">
                      ${price.toLocaleString()}
                    </span>
                    <span className="text-gray-600 ml-2">
                      JMD/{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>

                  {billingCycle === 'yearly' && percentSaved > 0 && (
                    <div className="text-sm text-green-600 font-semibold mb-4">
                      Save {percentSaved}% with yearly billing
                    </div>
                  )}

                  <div className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="text-sm">
                        {feature}
                      </div>
                    ))}
                  </div>

                  {plan.limitations.length > 0 && (
                    <div className="border-t pt-4 mb-4">
                      <div className="text-xs text-gray-500">
                        {plan.limitations.map((limit, index) => (
                          <div key={index}>• {limit}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    className={`w-full py-3 rounded-lg font-semibold transition ${
                      plan.name === 'Basic'
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700'
                    }`}
                  >
                    {plan.name === 'Basic' ? 'Start Free' : 'Subscribe Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Part Request Notification System */}
        <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-8 mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">💰 Part Request Notification System</h2>
          <p className="text-center text-gray-700 mb-8">
            Our unique monetization model: Buyers can pay for urgent requests, and you get notified based on your tier!
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6">
              <div className="text-2xl mb-3">🆓 Free Requests</div>
              <div className="text-gray-700">
                <p className="mb-2">Standard buyer requests</p>
                <div className="text-sm space-y-1">
                  <div>• Basic tier: 24-48hr delay</div>
                  <div>• Silver/Gold: Next day</div>
                  <div>• Platinum: Same day</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6">
              <div className="text-2xl mb-3">🔥 Urgent Requests ($500)</div>
              <div className="text-gray-700">
                <p className="mb-2">Buyer pays for urgency</p>
                <div className="text-sm space-y-1">
                  <div>• Basic tier: No notification</div>
                  <div className="font-semibold text-green-600">• Silver/Gold: Instant alert!</div>
                  <div className="font-semibold text-green-600">• Platinum: Priority alert!</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6">
              <div className="text-2xl mb-3">⭐ Premium Requests ($1000)</div>
              <div className="text-gray-700">
                <p className="mb-2">Featured buyer requests</p>
                <div className="text-sm space-y-1">
                  <div>• Basic tier: No notification</div>
                  <div className="font-semibold text-purple-600">• ALL paid tiers: Instant priority!</div>
                  <div className="font-semibold text-purple-600">• Featured for 7 days</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Revenue Opportunities */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">📈 Additional Revenue Boosters</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalRevenue.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                <div className="text-teal-600 font-bold">{item.pricing}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Commission Structure */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Commission Structure</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-3">Subscription Tier</th>
                  <th className="text-center py-3">Commission Rate</th>
                  <th className="text-center py-3">Monthly Sales $10,000</th>
                  <th className="text-center py-3">Monthly Sales $50,000</th>
                  <th className="text-center py-3">Monthly Sales $100,000</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 font-medium">Basic (Free)</td>
                  <td className="text-center text-red-600 font-bold">5%</td>
                  <td className="text-center">$500</td>
                  <td className="text-center">$2,500</td>
                  <td className="text-center">$5,000</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium">Silver ($2,999/mo)</td>
                  <td className="text-center text-orange-600 font-bold">4%</td>
                  <td className="text-center">$400</td>
                  <td className="text-center">$2,000</td>
                  <td className="text-center">$4,000</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium">Gold ($5,999/mo)</td>
                  <td className="text-center text-yellow-600 font-bold">3%</td>
                  <td className="text-center">$300</td>
                  <td className="text-center">$1,500</td>
                  <td className="text-center">$3,000</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Platinum ($14,999/mo)</td>
                  <td className="text-center text-green-600 font-bold">2%</td>
                  <td className="text-center">$200</td>
                  <td className="text-center">$1,000</td>
                  <td className="text-center">$2,000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-4 text-center">
            * Higher tier = Lower commission = More profit for you!
          </p>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-blue-900 to-teal-700 text-white rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Auto Parts Business?</h2>
          <p className="text-xl mb-6">Join 5,000+ sellers already making money on PartsFinda</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/seller/register"
              className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              Start Selling Now
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
