'use client';

import Link from 'next/link';
import { Check, Star, Zap, Crown, Gift, ArrowRight, Users, TrendingUp, Clock, Shield } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: 'J$0',
      period: '/month',
      description: 'Perfect for getting started',
      popular: false,
      features: [
        'Basic business listing',
        'Receive part requests',
        '24-hour response requirement',
        'Email notifications only',
        'Basic customer support',
        'Access to buyer requests',
        'Standard search placement',
        'Basic analytics dashboard'
      ],
      limitations: [
        'Limited visibility in search',
        'No priority notifications',
        'No featured placement',
        'Basic support only'
      ],
      icon: <Gift className="w-8 h-8 text-gray-600" />,
      color: 'border-gray-200',
      buttonStyle: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
      buttonText: 'Get Started Free'
    },
    {
      name: 'Basic',
      price: 'J$2,500',
      period: '/month',
      description: 'Most popular for growing businesses',
      popular: true,
      features: [
        'Priority business listing',
        'Instant notifications',
        'Enhanced search placement',
        'Advanced analytics & insights',
        'Phone & email support',
        'Customer review management',
        'Bulk messaging to buyers',
        'Performance tracking tools',
        'Lead management system',
        'Mobile app access'
      ],
      benefits: [
        '3x more visibility than free plan',
        'Faster response times boost sales',
        'Professional business profile'
      ],
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      color: 'border-blue-500',
      buttonStyle: 'bg-blue-600 hover:bg-blue-700 text-white',
      buttonText: 'Start Basic Plan'
    },
    {
      name: 'Premium',
      price: 'J$5,000',
      period: '/month',
      description: 'For established businesses',
      popular: false,
      features: [
        'Top placement in all searches',
        'Featured supplier badge',
        'Dedicated account manager',
        'White-glove onboarding',
        'Custom business profile',
        'Unlimited bulk messaging',
        'Advanced lead analytics',
        'Priority customer support',
        'API access for integrations',
        'Custom reporting dashboards',
        'Marketing campaign support',
        'Exclusive supplier events'
      ],
      benefits: [
        '10x more leads than free plan',
        'Premium brand positioning',
        'Dedicated success manager'
      ],
      icon: <Crown className="w-8 h-8 text-purple-600" />,
      color: 'border-purple-500',
      buttonStyle: 'bg-purple-600 hover:bg-purple-700 text-white',
      buttonText: 'Go Premium'
    }
  ];

  const stats = [
    { icon: <Users className="w-6 h-6" />, number: '150+', label: 'Active Suppliers' },
    { icon: <TrendingUp className="w-6 h-6" />, number: '2,500+', label: 'Monthly Requests' },
    { icon: <Clock className="w-6 h-6" />, number: '98%', label: 'Success Rate' },
    { icon: <Shield className="w-6 h-6" />, number: '24/7', label: 'Platform Support' }
  ];

  const faqs = [
    {
      question: 'Can I change my plan anytime?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.'
    },
    {
      question: 'Is there a setup fee?',
      answer: 'No setup fees for any plan. You only pay the monthly subscription fee.'
    },
    {
      question: 'How do I get paid by buyers?',
      answer: 'You arrange payment directly with buyers. We facilitate the connection but don\'t process payments.'
    },
    {
      question: 'What happens if I cancel?',
      answer: 'You can cancel anytime. Your account remains active until the end of your billing period.'
    },
    {
      question: 'Do you offer discounts for annual payments?',
      answer: 'Yes! Save 15% when you pay annually instead of monthly. Contact us for more details.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Star className="w-4 h-4" />
              Trusted by 150+ Suppliers
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Supplier Membership Plans
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Choose the plan that works best for your business. All plans include access to
              Jamaica's largest car parts marketplace with thousands of active buyers.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-8">
                <div className="flex justify-center mb-4 text-blue-600">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              No hidden fees. Cancel anytime. Start free and upgrade as you grow.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden relative ${
                  plan.popular ? 'border-2 border-blue-500 transform scale-105' : 'border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    {plan.icon}
                    <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
                  </div>

                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-800">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>

                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors mb-8 ${plan.buttonStyle}`}>
                    {plan.buttonText}
                  </button>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">Features included:</h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.benefits && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-3">Key Benefits:</h4>
                        <ul className="space-y-2">
                          {plan.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700 text-sm font-medium">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Not sure which plan is right for you?
            </p>
            <Link
              href="/contact"
              className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-2"
            >
              Contact our team
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Compare Plans
            </h2>
            <p className="text-xl text-gray-600">
              See all features side by side
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-6 font-semibold text-gray-800">Features</th>
                  <th className="text-center p-6 font-semibold text-gray-800">Free</th>
                  <th className="text-center p-6 font-semibold text-gray-800 bg-blue-50">Basic</th>
                  <th className="text-center p-6 font-semibold text-gray-800">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-6 font-medium">Business Listing</td>
                  <td className="p-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-6 text-center bg-blue-50"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-6 font-medium">Response Time Requirement</td>
                  <td className="p-6 text-center text-gray-600">24 hours</td>
                  <td className="p-6 text-center bg-blue-50 text-gray-600">12 hours</td>
                  <td className="p-6 text-center text-gray-600">6 hours</td>
                </tr>
                <tr>
                  <td className="p-6 font-medium">Search Placement</td>
                  <td className="p-6 text-center text-gray-600">Standard</td>
                  <td className="p-6 text-center bg-blue-50 text-gray-600">Priority</td>
                  <td className="p-6 text-center text-gray-600">Top Placement</td>
                </tr>
                <tr>
                  <td className="p-6 font-medium">Analytics Dashboard</td>
                  <td className="p-6 text-center text-gray-600">Basic</td>
                  <td className="p-6 text-center bg-blue-50 text-gray-600">Advanced</td>
                  <td className="p-6 text-center text-gray-600">Premium</td>
                </tr>
                <tr>
                  <td className="p-6 font-medium">Customer Support</td>
                  <td className="p-6 text-center text-gray-600">Email</td>
                  <td className="p-6 text-center bg-blue-50 text-gray-600">Phone & Email</td>
                  <td className="p-6 text-center text-gray-600">Dedicated Manager</td>
                </tr>
                <tr>
                  <td className="p-6 font-medium">Featured Badge</td>
                  <td className="p-6 text-center">✗</td>
                  <td className="p-6 text-center bg-blue-50">✗</td>
                  <td className="p-6 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-8 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join Jamaica's premier car parts marketplace and connect with thousands of buyers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/seller-signup"
              className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
