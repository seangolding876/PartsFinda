// components/LiveQueueMonitor.jsx
'use client';

import { useState, useEffect } from 'react';
import WorkerLogs from '@/components/admin/WorkerLogs';
import { getAuthData } from '@/lib/auth';

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
interface SuccessfulRequest {
  request_id: number;
  part_name: string;
  budget: number;
  request_created: string;
  request_status: string;
  buyer: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  sellers: Array<{
    seller_id: number;
    seller_name: string;
    business_name: string;
    membership_plan: string;
    queue_status: string;
    processed_at: string;
    has_quote: boolean;
    quoted_price: number;
    quote_status: string;
    quote_created: string;
    has_conversation: boolean;
    has_messages: boolean;
    last_message_time: string;
  }>;
}


export default function LiveQueueMonitor() {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successfulRequests, setSuccessfulRequests] = useState<SuccessfulRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'successful'>('pending');

  const authData = getAuthData();

  // Fetch data function
  const fetchData = async () => {
    try {
      setError(null);
      
      const [statsResponse, workerResponse, successfulResponse] = await Promise.all([
        fetch('/api/queue/stats'),
        fetch('/api/worker/status'),
        fetch('/api/admin/successful-requests')
      ]);
            if (!statsResponse.ok || !workerResponse.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const statsData = await statsResponse.json();
      const workerData = await workerResponse.json();
      const successfulData = await successfulResponse.json();

      if (statsData.success) {
        setQueueStats(statsData.data);
      } else {
        throw new Error(statsData.error || 'Failed to fetch queue stats');
      }

      if (workerData.success && workerData.worker) {
        setWorkerStatus(workerData.worker);
      }

      if (successfulData.success) {
        setSuccessfulRequests(successfulData.data);
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

  function PendingRequestsTable({ queueStats }) {
  return (
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
  );
}

// New Successful Requests Component
function SuccessfulRequestsTable({ successfulRequests }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Request & Buyer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sellers Contacted
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Responses
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Chat Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sent Time
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {successfulRequests.map((request) => (
            <tr key={request.request_id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">
                  #{request.request_id} - {request.part_name}
                </div>
                <div className="text-sm text-gray-500">
                  Budget: ₹{request.budget?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-400">
                  Buyer: {request.buyer.name}
                </div>
              </td>
              
              <td className="px-6 py-4">
                <div className="space-y-2">
                  {request.sellers.map((seller) => (
                    <div key={seller.seller_id} className="text-sm">
                      <div className="font-medium text-gray-900">
                        {seller.seller_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {seller.business_name} • {seller.membership_plan}
                      </div>
                    </div>
                  ))}
                </div>
              </td>
              
              <td className="px-6 py-4">
                <div className="space-y-2">
                  {request.sellers.map((seller) => (
                    <div key={seller.seller_id} className="text-sm">
                      {seller.has_quote ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✅</span>
                          <span>Quoted: ₹{seller.quoted_price}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            seller.quote_status === 'accepted' 
                              ? 'bg-green-100 text-green-800'
                              : seller.quote_status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {seller.quote_status}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-500">
                          <span className="text-gray-400">⏳</span>
                          <span>No response yet</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </td>
              
              <td className="px-6 py-4">
                <div className="space-y-2">
                  {request.sellers.map((seller) => (
                    <div key={seller.seller_id} className="text-sm">
                      {seller.has_messages ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <span>💬</span>
                          <span>Chat active</span>
                          <span className="text-xs text-gray-500">
                            {new Date(seller.last_message_time).toLocaleTimeString()}
                          </span>
                        </div>
                      ) : seller.has_conversation ? (
                        <div className="flex items-center space-x-2 text-blue-600">
                          <span>📩</span>
                          <span>Chat ready</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-500">
                          <span>📭</span>
                          <span>No chat</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </td>
              
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(request.request_created).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {successfulRequests.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No successfully sent requests yet
        </div>
      )}
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Queue Monitor ( Sending Parts to Seller ) </h1>
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
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Requests ({queueStats?.pending_requests?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('successful')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'successful'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Successfully Sent ({successfulRequests.length || 0})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'pending' && (
              <PendingRequestsTable queueStats={queueStats} />
            )}

            {activeTab === 'successful' && (
              <SuccessfulRequestsTable successfulRequests={successfulRequests} />
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


        <div className="grid grid-cols-1 gap-6">
          {/* Worker Logs Section */}
          <div className="col-span-1">
            <WorkerLogs authToken={authData} />
          </div>

          {/* Other sections... */}
        </div>
      </div>
    </div>
  );
}