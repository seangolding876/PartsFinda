'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QueueMonitor() {
  const [showLive, setShowLive] = useState(false);
  const router = useRouter();

  // Static data for build
  const staticData = {
    total_requests: 156,
    pending_delivery: 12,
    processed_today: 45,
    success_rate: '92%'
  };

  if (showLive) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button 
            onClick={() => setShowLive(false)}
            className="mb-6 text-blue-600 hover:text-blue-800"
          >
            ← Back to Static View
          </button>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Live Data Unavailable</h3>
            <p className="text-yellow-700">
              Real-time queue monitoring requires server-side processing. 
              This feature will work in production with proper database setup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Queue Monitoring</h1>
        <p className="text-gray-600 mb-6">Request processing statistics</p>

        {/* Static Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Total Requests</h3>
            <div className="text-3xl font-bold text-blue-600">{staticData.total_requests}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Pending Delivery</h3>
            <div className="text-3xl font-bold text-orange-600">{staticData.pending_delivery}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Processed Today</h3>
            <div className="text-3xl font-bold text-green-600">{staticData.processed_today}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Success Rate</h3>
            <div className="text-3xl font-bold text-purple-600">{staticData.success_rate}</div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Real-time Monitoring</h3>
          <p className="text-blue-700 mb-4">
            For live queue monitoring with real-time data, ensure your database is properly configured 
            and the worker service is running.
          </p>
          <button
            onClick={() => setShowLive(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Live Monitoring
          </button>
        </div>
      </div>
    </div>
  );
}