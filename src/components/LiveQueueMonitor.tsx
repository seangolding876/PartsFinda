// components/LiveQueueMonitor.jsx
'use client';

import { useState, useEffect } from 'react';

// Type definitions
interface QueueStats {
  total: {
    requests: number;
    completed: number;
    failed: number;
    processing: number;
    pending: number;
  };
  today: {
    processed: number;
    completed: number;
    failed: number;
  };
  pending_requests: Array<{
    id: number;
    priority: string;
    created_at: string;
    part_name: string;
    budget: number;
    seller_name: string;
    membership_plan: string;
    buyer_name: string;
  }>;
  success_rate: string;
}

interface WorkerStatus {
  status: string;
  name: string;
  uptime: number;
  memory: number;
  cpu: number;
  restarts: number;
  pid: number;
}

export default function LiveQueueMonitor() {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data function
  const fetchData = async () => {
    try {
      setError(null);
      
      const [statsResponse, workerResponse] = await Promise.all([
        fetch('/api/queue/stats'),
        fetch('/api/worker/status')
      ]);

      if (!statsResponse.ok || !workerResponse.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const statsData = await statsResponse.json();
      const workerData = await workerResponse.json();

      if (statsData.success) {
        setQueueStats(statsData.data);
      } else {
        throw new Error(statsData.error || 'Failed to fetch queue stats');
      }

      if (workerData.success && workerData.worker) {
        setWorkerStatus(workerData.worker);
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Worker control function
  const controlWorker = async (action: string) => {
    try {
      const response = await fetch('/api/worker/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Worker ${action}ed successfully`);
        // Refresh data after 2 seconds
        setTimeout(fetchData, 2000);
      } else {
        alert(`❌ Failed to ${action} worker: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Worker control error:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading live queue data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Error: </strong> {error}
            </div>
            <button
              onClick={fetchData}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Queue Monitor</h1>
            <p className="text-gray-600">Real-time PartsFinda Worker Monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-medium ${
                autoRefresh 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              } transition-colors`}
            >
              Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <button 
              onClick={fetchData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Now
            </button>
          </div>
        </div>

        {/* Worker Status Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Worker Status</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => controlWorker('start')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Start Worker
              </button>
              <button
                onClick={() => controlWorker('stop')}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Stop Worker
              </button>
              <button
                onClick={() => controlWorker('restart')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Restart Worker
              </button>
            </div>
          </div>

          {workerStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-lg font-bold ${
                  workerStatus.status === 'online' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {workerStatus.status.toUpperCase()}
                </div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{workerStatus.pid}</div>
                <div className="text-sm text-gray-600">Process ID</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  {Math.round(workerStatus.uptime / 1000 / 60)}m
                </div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{workerStatus.restarts}</div>
                <div className="text-sm text-gray-600">Restarts</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-red-600 font-medium">Worker not running</p>
              <button
                onClick={() => controlWorker('start')}
                className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Start Worker Now
              </button>
            </div>
          )}
        </div>

        {/* Stats Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Requests Card */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Total Requests</h3>
            <div className="text-3xl font-bold text-blue-600">{queueStats?.total.requests || 0}</div>
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="text-green-600 font-medium">{queueStats?.total.completed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed:</span>
                <span className="text-red-600 font-medium">{queueStats?.total.failed || 0}</span>
              </div>
            </div>
          </div>

          {/* Pending Queue Card */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Pending Queue</h3>
            <div className="text-3xl font-bold text-orange-600">{queueStats?.total.pending || 0}</div>
            <div className="text-sm text-gray-600 mt-2">
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span className="font-semibold">{queueStats?.success_rate || '0%'}</span>
              </div>
            </div>
          </div>

          {/* Today's Activity Card */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Today's Activity</h3>
            <div className="text-3xl font-bold text-green-600">{queueStats?.today.processed || 0}</div>
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="text-green-600 font-medium">{queueStats?.today.completed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed:</span>
                <span className="text-red-600 font-medium">{queueStats?.today.failed || 0}</span>
              </div>
            </div>
          </div>

          {/* In Progress Card */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">In Progress</h3>
            <div className="text-3xl font-bold text-purple-600">{queueStats?.total.processing || 0}</div>
            <div className="text-sm text-gray-600 mt-2">
              <div className="flex justify-between">
                <span>Worker Status:</span>
                <span className={
                  workerStatus?.status === 'online' 
                    ? 'text-green-600 font-medium' 
                    : 'text-red-600 font-medium'
                }>
                  {workerStatus?.status || 'stopped'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests Table */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Requests ({queueStats?.pending_requests?.length || 0})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Part Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {queueStats?.pending_requests?.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{request.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.part_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.buyer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {request.seller_name}
                        <br />
                        <span className="text-xs text-gray-500 capitalize">{request.membership_plan}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{request.budget?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.priority === 'high' 
                          ? 'bg-red-100 text-red-800'
                          : request.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {request.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!queueStats?.pending_requests || queueStats.pending_requests.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No pending requests in queue
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {/* <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => window.open('http://localhost:9615', '_blank')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Open PM2 Monitor
            </button>
            <button 
              onClick={() => controlWorker('restart')}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
            >
              Force Restart Worker
            </button>
            <button 
              onClick={() => window.open('/api/queue/stats', '_blank')}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              View Raw API Data
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
}