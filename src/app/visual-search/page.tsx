'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Search, MessageSquare, Camera } from 'lucide-react';

export default function VisualSearchRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push('/request-part');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">AI Search Coming Soon!</h1>
            <p className="text-gray-600 text-lg mb-6">
              Visual AI search is being saved for <strong>Phase 2</strong>.
              For now, let's get you connected with sellers the proven way!
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current System Works Great:</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-sm">Describe Your Part</h3>
                <p className="text-xs text-gray-600">Tell us exactly what you need</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-sm">Get Expert Quotes</h3>
                <p className="text-xs text-gray-600">Sellers know exactly what you're after</p>
              </div>
              <div className="text-center">
                <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <ArrowRight className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-sm">Choose Best Price</h3>
                <p className="text-xs text-gray-600">Pick from competitive offers</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="/request-part"
              className="block w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Request Your Parts Now
            </Link>

            <p className="text-sm text-gray-500">
              Redirecting automatically in 5 seconds...
            </p>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500">
              <strong>Phase 2 Preview:</strong> AI image recognition + visual search + marketplace browsing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
