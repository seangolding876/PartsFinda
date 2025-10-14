'use client'; // ✅ Yeh important hai - client component banayein

import { useState, useEffect } from 'react';

interface QueueStats {
  status: Array<{
    status: string;
    count: string;
    avg_delay_seconds: number;
    max_retries: number;
  }>;
  pendingDetails: {
    total_pending: string;
    avg_delay_seconds: number;
    oldest_pending: string;
  };
  workerStats: {
    processed: number;
    failed: number;
    retried: number;
    isProcessing: boolean;
    lastUpdated: string;
  };
}

export default function AdminQueueMonitor() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await fetch('/api/worker/start?action=status');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setStats(result);
      } else {
        throw new Error(result.error || 'Failed to fetch stats');
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message || 'Failed to load queue statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading queue statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <h3 className="font-bold mb-2">Error Loading Dashboard</h3>
            <p>{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Queue Monitoring Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time monitoring of part request deliveries</p>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto Refresh (10s)
            </label>
          </div>
        </div>

        {/* Worker Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Worker Status</h3>
            <div className={`text-2xl font-bold ${
              stats?.workerStats?.isProcessing ? 'text-green-600' : 'text-gray-600'
            }`}>
              {stats?.workerStats?.isProcessing ? '🟢 Running' : '🟡 Idle'}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Last updated: {stats?.workerStats?.lastUpdated ? 
                new Date(stats.workerStats.lastUpdated).toLocaleTimeString() : 'N/A'
              }
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Processed</h3>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.workerStats?.processed || 0}
            </div>
            <p className="text-sm text-gray-600">Successful deliveries</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Failed</h3>
            <div className="text-2xl font-bold text-red-600">
              {stats?.workerStats?.failed || 0}
            </div>
            <p className="text-sm text-gray-600">Delivery failures</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Retried</h3>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.workerStats?.retried || 0}
            </div>
            <p className="text-sm text-gray-600">Auto-retry attempts</p>
          </div>
        </div>

        {/* Queue Status */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Queue Status Breakdown</h3>
              <div className="space-y-4">
                {stats.status?.map((item) => (
                  <div key={item.status} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium capitalize">{item.status}</span>
                    <div className="text-right">
                      <div className="text-lg font-bold">{item.count}</div>
                      {item.avg_delay_seconds && (
                        <div className="text-sm text-gray-600">
                          Avg delay: {Math.round(item.avg_delay_seconds)}s
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Pending Requests Details</h3>
              {stats.pendingDetails && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                    <span className="font-medium">Total Pending</span>
                    <span className="text-xl font-bold text-yellow-600">
                      {stats.pendingDetails.total_pending || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                    <span className="font-medium">Average Delay</span>
                    <span className="text-lg font-bold text-orange-600">
                      {Math.round(stats.pendingDetails.avg_delay_seconds || 0)} seconds
                    </span>
                  </div>
                  {stats.pendingDetails.oldest_pending && (
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                      <span className="font-medium">Oldest Pending</span>
                      <span className="text-sm font-bold text-red-600">
                        {new Date(stats.pendingDetails.oldest_pending).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!stats && !loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-4">
              Queue statistics are not available. The worker might not be running.
            </p>
            <button
              onClick={() => fetch('/api/worker/start?action=start')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Start Worker
            </button>
          </div>
        )}
      </div>
    </div>
  );
}