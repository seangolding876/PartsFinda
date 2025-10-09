'use client';

import { useState, useEffect, Suspense } from 'react';
import { Search, Filter, Plus, Eye, MessageCircle, Clock, CheckCircle, XCircle, Star, MapPin, Calendar, Package, TrendingUp, User, Settings, Bell, Heart, DollarSign, BarChart3, Truck, AlertCircle, Edit, Send } from 'lucide-react';
import Link from 'next/link';

function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const stats = [
    { icon: <Package className="w-6 h-6" />, label: 'Active Listings', value: '45', color: 'text-blue-600', bg: 'bg-blue-100', trend: '+5 this week' },
    { icon: <MessageCircle className="w-6 h-6" />, label: 'Pending Quotes', value: '12', color: 'text-orange-600', bg: 'bg-orange-100', trend: '3 urgent' },
    { icon: <CheckCircle className="w-6 h-6" />, label: 'Completed Orders', value: '89', color: 'text-green-600', bg: 'bg-green-100', trend: '+8 this month' },
    { icon: <DollarSign className="w-6 h-6" />, label: 'Monthly Revenue', value: 'J$125,000', color: 'text-purple-600', bg: 'bg-purple-100', trend: '+15% vs last month' }
  ];

  const pendingRequests = [
    {
      id: 'REQ-001',
      partName: 'Brake Pads Set',
      buyer: 'John Doe',
      vehicle: '2020 Toyota Camry',
      budget: 'J$5,000 - J$10,000',
      urgency: 'urgent',
      dateReceived: '2024-01-16T08:30:00Z',
      expiresAt: '2024-01-23T08:30:00Z',
      description: 'Front brake pads for 2020 Toyota Camry. Looking for ceramic pads with good quality.',
      location: 'Kingston',
      quotesSubmitted: 0,
      quoted: false
    },
    {
      id: 'REQ-002',
      partName: 'Engine Oil Filter',
      buyer: 'Sarah Wilson',
      vehicle: '2019 Honda Civic',
      budget: 'J$2,000 - J$3,000',
      urgency: 'normal',
      dateReceived: '2024-01-15T14:20:00Z',
      expiresAt: '2024-01-22T14:20:00Z',
      description: 'OEM quality oil filter for Honda Civic 2019.',
      location: 'St. Andrew',
      quotesSubmitted: 1,
      quoted: true
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Seller Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your inventory, quotes, and orders</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/request-part"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Part
              </Link>
              <Link
                href="/seller/subscription"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Kingston Auto Parts</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">4.8 (127 reviews)</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  Premium Member
                </div>
                <p className="text-green-700 text-xs mt-1">Your plan expires in 23 days</p>
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
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                    activeTab === 'requests' ? 'bg-blue-100 text-blue-600 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  <span>Part Requests</span>
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {pendingRequests.filter(r => !r.quoted).length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('quotes')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'quotes' ? 'bg-blue-100 text-blue-600 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  My Quotes
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'inventory' ? 'bg-blue-100 text-blue-600 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  Inventory
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'orders' ? 'bg-blue-100 text-blue-600 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  Orders
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
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                      <div className={`${stat.bg} rounded-full w-12 h-12 flex items-center justify-center mb-4`}>
                        <div className={stat.color}>{stat.icon}</div>
                      </div>
                      <div className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
                      <div className="text-xs text-green-600 font-medium">{stat.trend}</div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('requests')}
                      className="bg-orange-50 border border-orange-200 p-4 rounded-lg hover:bg-orange-100 transition-colors text-left"
                    >
                      <AlertCircle className="w-8 h-8 text-orange-600 mb-3" />
                      <h4 className="font-semibold text-gray-800">Pending Requests</h4>
                      <p className="text-sm text-gray-600">{pendingRequests.filter(r => !r.quoted).length} requests waiting for quotes</p>
                    </button>
                    <Link
                      href="/request-part"
                      className="bg-green-50 border border-green-200 p-4 rounded-lg hover:bg-green-100 transition-colors text-left block"
                    >
                      <Plus className="w-8 h-8 text-green-600 mb-3" />
                      <h4 className="font-semibold text-gray-800">Add New Part</h4>
                      <p className="text-sm text-gray-600">Expand your inventory</p>
                    </Link>
                    <Link
                      href="/seller/subscription"
                      className="bg-blue-50 border border-blue-200 p-4 rounded-lg hover:bg-blue-100 transition-colors text-left block"
                    >
                      <TrendingUp className="w-8 h-8 text-blue-600 mb-3" />
                      <h4 className="font-semibold text-gray-800">Upgrade Plan</h4>
                      <p className="text-sm text-gray-600">Get more features</p>
                    </Link>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Activity</h3>
                  <div className="space-y-4">
                    {pendingRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{request.partName}</h4>
                            <p className="text-sm text-gray-600">{request.buyer} • {request.vehicle}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${request.quoted ? getStatusColor('accepted') : getStatusColor('pending')}`}>
                            {request.quoted ? 'Quoted' : 'New Request'}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{timeAgo(request.dateReceived)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
                      <option value="all">All Requests</option>
                      <option value="unquoted">Not Quoted</option>
                      <option value="quoted">Already Quoted</option>
                    </select>
                  </div>
                </div>

                {/* Requests List */}
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="bg-white rounded-lg shadow-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">{request.partName}</h3>
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.urgency)}`}>
                              {request.urgency}
                            </div>
                            {request.quoted && (
                              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                Quoted
                              </div>
                            )}
                          </div>
                          <p className="text-gray-600 mb-2">{request.vehicle} • {request.buyer}</p>
                          <p className="text-gray-700 mb-4">{request.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Request ID: {request.id}</p>
                          <p className="text-sm text-gray-500">Received: {timeAgo(request.dateReceived)}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Budget</p>
                          <p className="text-green-600 font-bold">{request.budget}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Location</p>
                          <p className="text-gray-600">{request.location}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Expires</p>
                          <p className="text-red-600">{new Date(request.expiresAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Quotes</p>
                          <p className="text-blue-600 font-bold">{request.quotesSubmitted}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {!request.quoted ? (
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                            <Send className="w-4 h-4" />
                            Submit Quote
                          </button>
                        ) : (
                          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Edit Quote
                          </button>
                        )}
                        <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other tabs would be similar... */}
            {activeTab !== 'overview' && activeTab !== 'requests' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  {activeTab === 'quotes' && 'My Quotes'}
                  {activeTab === 'inventory' && 'Inventory Management'}
                  {activeTab === 'orders' && 'Order Management'}
                  {activeTab === 'profile' && 'Profile Settings'}
                </h3>
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Coming Soon</h4>
                  <p className="text-gray-600">
                    This section is under development and will be available soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SellerDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seller dashboard...</p>
        </div>
      </div>
    }>
      <SellerDashboard />
    </Suspense>
  );
}
