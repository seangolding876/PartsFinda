'use client';

import { useState, useEffect, Suspense } from 'react';
import { Search, Filter, Plus, Eye, MessageCircle, Clock, CheckCircle, XCircle, Star, MapPin, Calendar, Package, TrendingUp, User } from 'lucide-react';
import Link from 'next/link';
import BuyerProfile from '@/components/buyerprofile';

// Auth utility
const getAuthData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const authData = localStorage.getItem('authData');
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    return null;
  }
};

interface PartRequest {
  id: number;
  part_name: string;
  part_number?: string;
  make_name: string;
  model_name: string;
  year: number;
  description: string;
  budget: number;
  parish: string;
  condition: string;
  urgency: string;
  status: string;
  created_at: string;
  expires_at: string;
}

function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    quoted: 0,
    completed: 0,
    moneySaved: 0
  });

  // Fetch user's part requests
  const fetchUserRequests = async () => {
    try {
      setLoading(true);
      const authData = getAuthData();
      
      if (!authData?.token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch('/api/part-requests?action=getUserRequests', {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const result = await response.json();
      
      if (result.success) {
        setPartRequests(result.data);
        calculateStats(result.data);
      } else {
        console.error('Failed to fetch requests:', result.error);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from real data
  const calculateStats = (requests: PartRequest[]) => {
    const active = requests.filter(req => req.status === 'open').length;
    const quoted = requests.filter(req => 
      req.status === 'open' && parseInt(req.created_at) > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;
    const completed = requests.filter(req => req.status === 'fulfilled').length;
    
    // Calculate estimated savings (this would come from actual quote data)
    const moneySaved = requests
      .filter(req => req.status === 'fulfilled')
      .reduce((total, req) => total + (req.budget || 0) * 0.2, 0); // 20% savings estimate

    setStats({
      active,
      quoted,
      completed,
      moneySaved
    });
  };

  useEffect(() => {
    fetchUserRequests();
  }, []);

  const statsData = [
    { 
      icon: <Package className="w-6 h-6" />, 
      label: 'Active Requests', 
      value: stats.active.toString(), 
      color: 'text-blue-600', 
      bg: 'bg-blue-100' 
    },
    { 
      icon: <MessageCircle className="w-6 h-6" />, 
      label: 'Recent Quotes', 
      value: stats.quoted.toString(), 
      color: 'text-green-600', 
      bg: 'bg-green-100' 
    },
    { 
      icon: <CheckCircle className="w-6 h-6" />, 
      label: 'Completed Orders', 
      value: stats.completed.toString(), 
      color: 'text-purple-600', 
      bg: 'bg-purple-100' 
    },
    { 
      icon: <TrendingUp className="w-6 h-6" />, 
      label: 'Money Saved', 
      value: `J$${stats.moneySaved.toLocaleString()}`, 
      color: 'text-orange-600', 
      bg: 'bg-orange-100' 
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredRequests = partRequests.filter(request => {
    const matchesSearch = request.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.make_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.model_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  const authData = getAuthData();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Buyer Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your part requests and orders</p>
            </div>
            <Link
              href="/request-part"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Request
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{authData?.name || 'Your Account'}</h3>
                  <p className="text-sm text-gray-600">{partRequests.length} requests</p>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'overview' ? 'bg-blue-100 text-blue-600 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'requests' ? 'bg-blue-100 text-blue-600 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  My Requests ({partRequests.length})
                </button>
                <button
                  onClick={() => setActiveTab('quotes')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'quotes' ? 'bg-blue-100 text-blue-600 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  Quotes Received
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'profile' ? 'bg-blue-100 text-blue-600 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  Profile Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6">
                  {statsData.map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                      <div className={`${stat.bg} rounded-full w-12 h-12 flex items-center justify-center mb-4`}>
                        <div className={stat.color}>{stat.icon}</div>
                      </div>
                      <div className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Recent Requests */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Requests</h3>
                  {partRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No part requests yet</p>
                      <Link
                        href="/request-part"
                        className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                      >
                        Create Your First Request
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {partRequests.slice(0, 3).map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
                              <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{request.part_name}</h4>
                              <p className="text-sm text-gray-600">{request.make_name} {request.model_name} ({request.year})</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                              {request.status}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(request.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-6">
                {/* Search and Filter */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search requests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="open">Active</option>
                      <option value="fulfilled">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Requests List */}
                <div className="space-y-4">
                  {filteredRequests.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        {partRequests.length === 0 
                          ? "You haven't created any part requests yet."
                          : "No requests match your search criteria."
                        }
                      </p>
                      {partRequests.length === 0 && (
                        <Link
                          href="/request-part"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors inline-block"
                        >
                          Create Your First Request
                        </Link>
                      )}
                    </div>
                  ) : (
                    filteredRequests.map((request) => (
                      <div key={request.id} className="bg-white rounded-lg shadow-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-800">{request.part_name}</h3>
                              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                                {request.status}
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getUrgencyColor(request.urgency)}`}>
                                {request.urgency}
                              </div>
                            </div>
                            <p className="text-gray-600 mb-2">{request.make_name} {request.model_name} ({request.year})</p>
                            <p className="text-gray-700 mb-4">{request.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Request #{request.id}</p>
                            <p className="text-sm text-gray-500">Created: {formatDate(request.created_at)}</p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Budget</p>
                            <p className="text-green-600 font-bold">
                              {request.budget ? `J$${request.budget.toLocaleString()}` : 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Condition</p>
                            <p className="text-gray-600 capitalize">{request.condition}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Location</p>
                            <p className="text-gray-600">{request.parish}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Expires</p>
                            <p className="text-gray-600">{formatDate(request.expires_at)}</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            View Quotes
                          </button>
                          {request.status === 'cancelled' && (
                            <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                              Repost Request
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Other tabs (quotes, profile) remain similar but will be populated with real data */}
            {activeTab === 'quotes' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Quotes Received</h3>
                <p className="text-gray-600">Quotes functionality will be implemented soon.</p>
              </div>
            )}

            {/* {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Profile Settings</h3>
                <p className="text-gray-600">Profile settings and preferences will be available here.</p>
              </div>
            )} */}

            {activeTab === 'profile' && (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h3 className="text-xl font-bold text-gray-800 mb-6">Profile Settings</h3>
    <BuyerProfile />
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyRequestsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    }>
      <BuyerDashboard />
    </Suspense>
  );
}