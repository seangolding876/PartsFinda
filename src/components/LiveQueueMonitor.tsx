'use client';

import { useState, useEffect } from 'react';

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
  pending_requests: any[];
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

const fetchData = async () => {
  try {
    setError(null);
    console.log('🔍 Fetching queue data...');
    
    const statsResponse = await fetch('/api/queue/stats');
    console.log('📊 Stats Response Status:', statsResponse.status);

    if (!statsResponse.ok) {
      throw new Error(`API Error: ${statsResponse.status}`);
    }

    const statsData = await statsResponse.json();
    console.log('📈 Full Stats Response:', statsData);

    if (statsData.success) {
      console.log('📋 Processed Data Structure:', {
        total: statsData.data.total,
        today: statsData.data.today,
        pending_requests_type: typeof statsData.data.pending_requests,
        pending_requests_length: statsData.data.pending_requests?.length,
        pending_requests_sample: statsData.data.pending_requests?.[0]
      });
      
      setQueueStats(statsData.data);
    } else {
      setError(`Stats API Error: ${statsData.error}`);
    }

    // Worker status...
    try {
      const workerResponse = await fetch('/api/worker/status');
      const workerData = await workerResponse.json();
      
      if (workerData.success && workerData.worker) {
        setWorkerStatus(workerData.worker);
      }
    } catch (workerError) {
      console.log('Worker API failed');
    }

  } catch (error) {
    console.error('❌ Error fetching data:', error);
    setError(`Network Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  const controlWorker = async (action: string) => {
    try {
      const response = await fetch('/api/worker/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert(`Worker ${action}ed successfully`);
          setTimeout(fetchData, 2000);
        } else {
          alert(`Failed to ${action} worker: ${result.error}`);
        }
      } else {
        alert(`Worker control API not available. Action: ${action}`);
      }
    } catch (error) {
      console.error('Worker control error:', error);
      alert(`Worker control failed. Please check server logs.`);
    }
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Debug info - remove in production
  useEffect(() => {
    if (queueStats) {
      console.log('🔄 Current Queue Stats:', queueStats);
    }
  }, [queueStats]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error: </strong>{error}
          </div>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <strong>Note: </strong>Showing demo data for testing
          </div>
          <div className="text-center py-8">
            <button
              onClick={fetchData}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
            >
              Retry Fetch Real Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading live queue data...</p>
            <p className="text-sm text-gray-500">Checking database connections</p>
          </div>
        </div>
      </div>
    );
  }

  // Safe array handling
  const pendingRequests = Array.isArray(queueStats?.pending_requests) 
    ? queueStats.pending_requests 
    : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Queue Monitor</h1>
            <p className="text-gray-600">Real-time PartsFinda Worker Monitoring</p>
            <p className="text-sm text-green-600 mt-1">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded ${
                autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'
              }`}
            >
              Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Worker Status Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Worker Status</h2>
            <div className="flex gap-2">
              <button
                onClick={() => controlWorker('start')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Start Worker
              </button>
              <button
                onClick={() => controlWorker('stop')}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Stop Worker
              </button>
              <button
                onClick={() => controlWorker('restart')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Restart Worker
              </button>
            </div>
          </div>

          {workerStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  workerStatus.status === 'online' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {workerStatus.status.toUpperCase()}
                </div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{workerStatus.pid}</div>
                <div className="text-sm text-gray-600">PID</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {Math.round(workerStatus.uptime / 1000 / 60)}m
                </div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{workerStatus.restarts}</div>
                <div className="text-sm text-gray-600">Restarts</div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Requests */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-600">Total Requests</h3>
            <div className="text-3xl font-bold">{queueStats?.total.requests || 0}</div>
            <div className="text-sm text-gray-600 mt-2">
              <div>✅ Completed: <span className="text-green-600 font-semibold">{queueStats?.total.completed || 0}</span></div>
              <div>❌ Failed: <span className="text-red-600 font-semibold">{queueStats?.total.failed || 0}</span></div>
              <div>⏳ Processing: <span className="text-orange-600 font-semibold">{queueStats?.total.processing || 0}</span></div>
            </div>
          </div>

          {/* Pending Queue */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2 text-orange-600">Pending Queue</h3>
            <div className="text-3xl font-bold">{queueStats?.total.pending || 0}</div>
            <div className="text-sm text-gray-600 mt-2">
              Success Rate: <span className="font-semibold">{queueStats?.success_rate || '0%'}</span>
              <div className="mt-1 text-xs">
                In Queue: {pendingRequests.length} requests
              </div>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2 text-green-600">Today's Activity</h3>
            <div className="text-3xl font-bold">{queueStats?.today.processed || 0}</div>
            <div className="text-sm text-gray-600 mt-2">
              <div>✅ Completed: <span className="text-green-600 font-semibold">{queueStats?.today.completed || 0}</span></div>
              <div>❌ Failed: <span className="text-red-600 font-semibold">{queueStats?.today.failed || 0}</span></div>
            </div>
          </div>

          {/* Currently Processing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2 text-purple-600">In Progress</h3>
            <div className="text-3xl font-bold">{queueStats?.total.processing || 0}</div>
            <div className="text-sm text-gray-600 mt-2">
              Worker: <span className="text-green-600 font-semibold">
                {workerStatus?.status || 'online'}
              </span>
              <div className="mt-1 text-xs">
                Active and processing
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests Table */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">
              Pending Requests ({pendingRequests.length})
              <span className="text-sm font-normal text-gray-600 ml-2">
                • High priority first
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{request.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{request.part_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{request.buyer_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {request.seller_name}
                      <br />
                      <span className={`text-xs ${
                        request.membership_plan === 'premium' ? 'text-yellow-600 font-semibold' : 'text-gray-500'
                      }`}>
                        {request.membership_plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{request.budget}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.urgency === 'high' 
                          ? 'bg-red-100 text-red-800'
                          : request.urgency === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {request.urgency}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                🎉 No pending requests in queue - All caught up!
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => window.open('http://localhost:9615', '_blank')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Open PM2 Monitor
            </button>
            <button 
              onClick={() => controlWorker('restart')}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            >
              Force Restart Worker
            </button>
            <button 
              onClick={fetchData}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Refresh Now
            </button>
            <button 
              onClick={() => console.log('Current Stats:', queueStats)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Debug Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}