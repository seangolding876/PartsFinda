'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LiveQueueMonitor() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/worker/start?action=status');
      const result = await response.json();
      
      if (result.success) {
        setStats(result);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button 
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-800"
        >
          ← Back to Dashboard
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Live Queue Monitor</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading live data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold mb-2">Real-time Queue Monitoring</h2>
              <p className="text-gray-600 mb-6">
                This feature requires a running server with database connection.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.workerStats?.processed || 0}
                  </div>
                  <div className="text-sm text-blue-800">Processed</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.pendingDetails?.total_pending || 0}
                  </div>
                  <div className="text-sm text-green-800">Pending</div>
                </div>
                
                <div className="bg-red-50 p-4 rounded">
                  <div className="text-2xl font-bold text-red-600">
                    {stats?.workerStats?.failed || 0}
                  </div>
                  <div className="text-sm text-red-800">Failed</div>
                </div>
              </div>
              
              <button
                onClick={() => fetch('/api/worker/start?action=start')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Start Worker Service
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}