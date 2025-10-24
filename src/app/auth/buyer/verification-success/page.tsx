'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Search, Car, ShoppingCart, ArrowRight } from 'lucide-react';

export default function BuyerVerificationSuccess() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams) {
      setEmail(searchParams.get('email') || '');
      setIsLoading(false);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      icon: <Search className="w-6 h-6" />,
      title: "Search Parts",
      description: "Find auto parts by vehicle, category, or brand",
      link: "/parts",
      color: "bg-blue-500"
    },
    {
      icon: <Car className="w-6 h-6" />,
      title: "Browse by Vehicle",
      description: "Find parts specific to your vehicle make and model",
      link: "/vehicles",
      color: "bg-green-500"
    },
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      title: "Popular Categories",
      description: "Explore our most searched part categories",
      link: "/categories",
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Welcome to PartsFinda! 🎉
            </h1>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <p className="text-green-800 font-medium">
                Your email has been verified successfully!
              </p>
              {email && (
                <p className="text-green-700 text-sm mt-1">
                  Verified email: <strong>{email}</strong>
                </p>
              )}
            </div>

            <p className="text-lg text-gray-600 mb-2">
              Your buyer account is now fully activated and ready to use.
            </p>
            <p className="text-gray-500">
              Start exploring genuine auto parts from trusted Jamaican suppliers.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.link}
              className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow group"
            >
              <div className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <div className="text-white">
                  {action.icon}
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{action.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{action.description}</p>
              <div className="flex items-center justify-center gap-1 text-blue-600 font-medium text-sm">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Features Grid */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Why Shop with PartsFinda?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-3 rounded-lg flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Verified Suppliers</h3>
                <p className="text-gray-600 text-sm">All our sellers are verified Jamaican businesses</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Best Prices</h3>
                <p className="text-gray-600 text-sm">Compare prices from multiple suppliers</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 p-3 rounded-lg flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Quick Response</h3>
                <p className="text-gray-600 text-sm">Get fast responses from sellers</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-orange-100 p-3 rounded-lg flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Islandwide Delivery</h3>
                <p className="text-gray-600 text-sm">Parts delivered across Jamaica</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Link
            href="/parts"
            className="inline-flex items-center gap-2 bg-green-600 text-white py-4 px-8 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
          >
            <Search className="w-5 h-5" />
            Start Finding Parts Now
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <p className="text-gray-600 mt-4">
            Need help?{' '}
            <Link href="/contact" className="text-green-600 hover:underline font-medium">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}