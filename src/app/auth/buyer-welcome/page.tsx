'use client';


export const dynamic = 'force-dynamic';
export const runtime = 'edge';


import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Search, Heart, Bell, Car, Shield } from 'lucide-react';

export default function BuyerWelcomePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const name = searchParams.get('name');

  useEffect(() => {
    // Track successful registration
    console.log('Buyer registration completed:', { email, name });
  }, [email, name]);

  const features = [
    {
      icon: <Search className="w-6 h-6" />,
      title: "Search Parts",
      description: "Find genuine auto parts from trusted suppliers across Jamaica"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Save Favorites",
      description: "Save your favorite parts and suppliers for quick access"
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Get Notified",
      description: "Receive alerts when parts you need become available"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Verified Suppliers",
      description: "Buy with confidence from our verified supplier network"
    }
  ];

  const quickActions = [
    {
      title: "Complete Your Profile",
      description: "Add vehicle details for better recommendations",
      link: "/profile",
      buttonText: "Update Profile"
    },
    {
      title: "Verify Your Email",
      description: "Check your inbox to verify your email address",
      link: "#",
      buttonText: "Resend Email"
    },
    {
      title: "Browse Parts",
      description: "Start searching for auto parts now",
      link: "/parts",
      buttonText: "Start Shopping"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-green-600 text-white px-3 py-1 rounded font-bold text-xl">
              PartsFinda
            </div>
            <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-semibold">
              Jamaica
            </div>
          </Link>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Welcome to PartsFinda{name ? `, ${name}` : ''}!
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Your buyer account has been created successfully. We've sent a verification email to{' '}
              <span className="font-semibold text-green-700">{email}</span>.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-yellow-800 text-center">
                <strong>Important:</strong> Please verify your email address to unlock all features.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Discover Auto Parts Made Easy
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-green-600">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Get Started
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 text-center">
                <h3 className="font-semibold text-gray-800 mb-3">{action.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                <Link
                  href={action.link}
                  className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  {action.buttonText}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">
            Need help getting started?
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/help"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Help Center
            </Link>
            <Link
              href="/contact"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Contact Support
            </Link>
            <Link
              href="/buyer-guide"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Buyer's Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}