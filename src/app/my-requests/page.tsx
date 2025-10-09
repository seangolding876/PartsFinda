'use client';

import { useState, useEffect, Suspense } from 'react';
import { Search, Filter, Plus, Eye, MessageCircle, Clock, CheckCircle, XCircle, Star, MapPin, Calendar, Package, TrendingUp, User, Settings, Bell, Heart } from 'lucide-react';
import Link from 'next/link';

function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const stats = [
    { icon: <Package className="w-6 h-6" />, label: 'Active Requests', value: '8', color: 'text-blue-600', bg: 'bg-blue-100' },
    { icon: <MessageCircle className="w-6 h-6" />, label: 'Quotes Received', value: '24', color: 'text-green-600', bg: 'bg-green-100' },
    { icon: <CheckCircle className="w-6 h-6" />, label: 'Completed Orders', value: '12', color: 'text-purple-600', bg: 'bg-purple-100' },
    { icon: <TrendingUp className="w-6 h-6" />, label: 'Money Saved', value: 'J$45,000', color: 'text-orange-600', bg: 'bg-orange-100' }
  ];

  const recentRequests = [
    {
      id: 'REQ-001',
      partName: 'Brake Pads Set',
      vehicle: '2020 Toyota Camry',
      status: 'active',
      quotesReceived: 5,
      bestPrice: 'J$8,500',
      dateCreated: '2024-01-15',
      description: 'Front brake pads for 2020 Toyota Camry. Looking for ceramic pads with good quality.',
      budget: 'J$5,000 - J$10,000',
      parish: 'Kingston',
      urgency: 'normal'
    },
    {
      id: 'REQ-002',
      partName: 'Engine Oil Filter',
      vehicle: '2019 Honda Civic',
      status: 'completed',
      quotesReceived: 8,
      bestPrice: 'J$2,200',
      dateCreated: '2024-01-10',
      description: 'OEM quality oil filter for Honda Civic 2019.',
      budget: 'J$2,000 - J$3,000',
      parish: 'St. Andrew',
      urgency: 'normal'
    },
    {
      id: 'REQ-003',
      partName: 'Transmission Fluid',
      vehicle: '2021 Nissan Altima',
      status: 'quoted',
      quotesReceived: 3,
      bestPrice: 'J$4,200',
      dateCreated: '2024-01-12',
      description: 'ATF for automatic transmission. Need 4 liters.',
      budget: 'J$4,000 - J$6,000',
      parish: 'Portmore',
      urgency: 'urgent'
    },
    {
      id: 'REQ-004',
      partName: 'Air Filter',
      vehicle: '2018 BMW 3 Series',
      status: 'expired',
      quotesReceived: 2,
      bestPrice: 'J$3,500',
      dateCreated: '2023-12-28',
      description: 'High-flow air filter for BMW 3 Series.',
      budget: 'J$3,000 - J$5,000',
      parish: 'Spanish Town',
      urgency: 'normal'
    }
  ];

  const quotes = [
    {
      id: 'QUO-001',
      requestId: 'REQ-001',
      supplier: 'Kingston Auto Parts',
      supplierRating: 4.8,
      supplierLocation: 'Kingston',
      price: 'J$8,500',
      originalPrice: 'J$10,000',
      partCondition: 'New',
      warranty: '2 years',
      deliveryTime: '2-3 days',
      description: 'Premium ceramic brake pads with excellent stopping power.',
      features: ['Ceramic compound', 'Low noise', 'Extended life'],
      dateReceived: '2024-01-16',
      validUntil: '2024-01-23',
      status: 'pending'
    },
    {
      id: 'QUO-002',
      requestId: 'REQ-001',
      supplier: 'Spanish Town Motors',
      supplierRating: 4.9,
      supplierLocation: 'Spanish Town',
      price: 'J$9,200',
      partCondition: 'New',
      warranty: '1 year',
      deliveryTime: '1-2 days',
      description: 'OEM quality brake pads with quick delivery.',
      features: ['OEM specification', 'Quick delivery', 'Installation guide'],
      dateReceived: '2024-01-16',
      validUntil: '2024-01-25',
      status: 'pending'
    }
  ];

  const orderHistory = [
    {
      id: 'ORD-001',
      partName: 'Oil Filter',
      supplier: 'Auto Excellence',
      price: 'J$2,200',
      orderDate: '2024-01-08',
      deliveryDate: '2024-01-10',
      status: 'delivered',
      rating: 5,
      vehicle: '2019 Honda Civic'
    },
    {
      id: 'ORD-002',
      partName: 'Spark Plugs Set',
      supplier: 'Parts Pro Jamaica',
      price: 'J$1,800',
      orderDate: '2023-12-15',
      deliveryDate: '2023-12-18',
      status: 'delivered',
      rating: 4,
      vehicle: '2018 Nissan Altima'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'quoted': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = recentRequests.filter(request => {
    const matchesSearch = request.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.vehicle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
                  <h3 className="font-semibold text-gray-800">John Doe</h3>
                  <p className="text-sm text-gray-600">Buyer since 2023</p>
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
                  My Requests
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
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'orders' ? 'bg-blue-100 text-blue-600 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  Order History
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'favorites' ? 'bg-blue-100 text-blue-600 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  Favorite Suppliers
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
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Activity</h3>
                  <div className="space-y-4">
                    {recentRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{request.partName}</h4>
                            <p className="text-sm text-gray-600">{request.vehicle}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                            {request.status}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{request.quotesReceived} quotes</p>
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
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="quoted">Quoted</option>
                      <option value="completed">Completed</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>

                {/* Requests List */}
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div key={request.id} className="bg-white rounded-lg shadow-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">{request.partName}</h3>
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                              {request.status}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getUrgencyColor(request.urgency)}`}>
                              {request.urgency}
                            </div>
                          </div>
                          <p className="text-gray-600 mb-2">{request.vehicle}</p>
                          <p className="text-gray-700 mb-4">{request.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Request ID: {request.id}</p>
                          <p className="text-sm text-gray-500">Created: {request.dateCreated}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Budget</p>
                          <p className="text-green-600 font-bold">{request.budget}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Best Quote</p>
                          <p className="text-blue-600 font-bold">{request.bestPrice}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Quotes Received</p>
                          <p className="text-purple-600 font-bold">{request.quotesReceived}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Location</p>
                          <p className="text-gray-600">{request.parish}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          View Quotes ({request.quotesReceived})
                        </button>
                        {request.status === 'expired' && (
                          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                            Repost Request
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'quotes' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Received Quotes</h3>
                  <div className="space-y-6">
                    {quotes.map((quote) => (
                      <div key={quote.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-gray-800">{quote.supplier}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < Math.floor(quote.supplierRating)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">({quote.supplierRating})</span>
                              <span className="text-sm text-gray-500">• {quote.supplierLocation}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">{quote.price}</div>
                            {quote.originalPrice && (
                              <div className="text-sm text-gray-500 line-through">{quote.originalPrice}</div>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4">{quote.description}</p>

                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Condition</p>
                            <p className="text-gray-600">{quote.partCondition}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Warranty</p>
                            <p className="text-gray-600">{quote.warranty}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Delivery</p>
                            <p className="text-gray-600">{quote.deliveryTime}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {quote.features.map((feature, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                              {feature}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Valid until: {quote.validUntil}
                          </div>
                          <div className="flex gap-3">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                              Accept Quote
                            </button>
                            <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors">
                              Message Supplier
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Order History</h3>
                  <div className="space-y-4">
                    {orderHistory.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-gray-800">{order.partName}</h4>
                            <p className="text-gray-600">{order.vehicle}</p>
                            <p className="text-sm text-gray-500">Order #{order.id}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">{order.price}</div>
                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold mt-2">
                              {order.status}
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Supplier</p>
                            <p className="text-gray-600">{order.supplier}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Order Date</p>
                            <p className="text-gray-600">{order.orderDate}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Delivered</p>
                            <p className="text-gray-600">{order.deliveryDate}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-700">Your Rating:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < order.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors">
                              View Details
                            </button>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                              Order Again
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Favorite Suppliers</h3>
                <p className="text-gray-600">You haven't added any suppliers to your favorites yet. When you find suppliers you like, add them here for quick access.</p>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Profile Settings</h3>
                <p className="text-gray-600">Profile settings and preferences will be available here.</p>
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
