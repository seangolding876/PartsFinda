'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SellerSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    businessName: '',
    businessType: '',
    location: '',
    businessAddress: '',
    description: '',
    experience: '',
    specialties: [] as string[],
    acceptTerms: false,
    subscriptionPlan: 'basic'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const jamaicaParishes = [
    'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary',
    'St. Ann', 'Trelawny', 'St. James', 'Hanover', 'Westmoreland',
    'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'
  ];

  const businessTypes = [
    'Auto Parts Dealer',
    'Scrap Yard',
    'Auto Repair Shop',
    'Individual Seller',
    'Auto Parts Importer',
    'Used Car Dealer',
    'Performance Shop',
    'Other'
  ];

  const partSpecialties = [
    'Engine Parts',
    'Transmission',
    'Brakes',
    'Suspension',
    'Body Parts',
    'Electrical',
    'Interior',
    'Performance',
    'Japanese Cars',
    'European Cars',
    'American Cars',
    'Motorcycles',
    'Heavy Duty'
  ];

  const subscriptionPlans = [
    {
      id: 'basic',
      name: 'Basic (Free)',
      price: 'FREE',
      features: [
        'List unlimited parts',
        'Basic search visibility',
        'Standard notifications (24-48hr delay)',
        'Basic seller profile'
      ]
    },
    {
      id: 'silver',
      name: 'Silver',
      price: '$2,000 JMD/month',
      features: [
        'Everything in Basic',
        'Priority search placement',
        'Urgent request notifications',
        'Enhanced seller profile',
        'Customer analytics'
      ]
    },
    {
      id: 'gold',
      name: 'Gold',
      price: '$3,500 JMD/month',
      features: [
        'Everything in Silver',
        'Premium request notifications',
        'Featured seller badge',
        'Advanced analytics',
        'Marketing tools',
        'Dedicated support'
      ]
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError('You must accept the terms and conditions');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
            business_name: formData.businessName,
            role: 'seller'
          }
        }
      });

      if (authError) {
        setError(authError.message);
      } else {
        // Create seller profile
        if (data.user) {
          const { error: profileError } = await supabase
            .from('users')
            .insert([{
              id: data.user.id,
              email: formData.email,
              name: formData.name,
              phone: formData.phone,
              location: formData.location,
              role: 'seller',
              created_at: new Date().toISOString(),
            }]);

          // Create seller business profile
          const { error: businessError } = await supabase
            .from('seller_profiles')
            .insert([{
              user_id: data.user.id,
              business_name: formData.businessName,
              business_type: formData.businessType,
              business_address: formData.businessAddress,
              description: formData.description,
              experience: formData.experience,
              specialties: formData.specialties,
              subscription_plan: formData.subscriptionPlan,
              created_at: new Date().toISOString(),
            }]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }
          if (businessError) {
            console.error('Business profile creation error:', businessError);
          }
        }

        alert('Registration successful! Please check your email to verify your account. You will then be able to access your seller dashboard.');
        router.push('/auth/login');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSpecialtyChange = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Become a PartsFinda Seller
            </h2>
            <p className="mt-2 text-gray-600">
              Join Jamaica's largest auto parts marketplace
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="876-XXX-XXXX"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Parish *
                  </label>
                  <select
                    id="location"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select parish</option>
                    {jamaicaParishes.map(parish => (
                      <option key={parish} value={parish}>{parish}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                      Business Name *
                    </label>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                      Business Type *
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      required
                      value={formData.businessType}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select type</option>
                      {businessTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700">
                    Business Address
                  </label>
                  <input
                    id="businessAddress"
                    name="businessAddress"
                    type="text"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Business Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell customers about your business..."
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                    Years of Experience
                  </label>
                  <select
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select experience</option>
                    <option value="0-1">0-1 years</option>
                    <option value="2-5">2-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="11-20">11-20 years</option>
                    <option value="20+">20+ years</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Specialties */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Parts Specialties</h3>
              <p className="text-sm text-gray-600 mb-3">Select the types of parts you specialize in (optional)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {partSpecialties.map(specialty => (
                  <label key={specialty} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={() => handleSpecialtyChange(specialty)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Subscription Plans */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Your Plan</h3>
              <div className="space-y-3">
                {subscriptionPlans.map(plan => (
                  <label key={plan.id} className={`block p-4 border rounded-lg cursor-pointer transition-colors ${formData.subscriptionPlan === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                    <div className="flex items-start">
                      <input
                        type="radio"
                        name="subscriptionPlan"
                        value={plan.id}
                        checked={formData.subscriptionPlan === plan.id}
                        onChange={handleChange}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-gray-900">{plan.name}</h4>
                          <span className="font-bold text-blue-600">{plan.price}</span>
                        </div>
                        <ul className="mt-2 text-sm text-gray-600 space-y-1">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <span className="text-green-500 mr-1">✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex items-center">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                  Seller Terms and Conditions
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating seller account...' : 'Create Seller Account'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Need help? Contact us at{' '}
                <a href="mailto:partsfinda@gmail.com" className="text-blue-600 hover:text-blue-500">
                  partsfinda@gmail.com
                </a>
                {' '}or{' '}
                <a href="tel:1-876-219-3329" className="text-blue-600 hover:text-blue-500">
                  1-876-219-3329
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
