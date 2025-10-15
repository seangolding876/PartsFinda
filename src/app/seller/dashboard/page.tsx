'use client';

import { useState, useEffect, Suspense } from 'react';
import { Search, Filter, Plus, Eye, MessageCircle, Clock, CheckCircle, XCircle, Star, MapPin, Calendar, Package, TrendingUp, User, Settings, Bell, Heart, DollarSign, BarChart3, Truck, AlertCircle, Edit, Send, X, FileText, Phone, Mail, Car, CalendarDays, Shield, Package2 } from 'lucide-react';
import Link from 'next/link';

// Types
interface SellerRequest {
  id: number;
  partName: string;
  budget: number;
  parish: string;
  urgency: string;
  description: string;
  vehicleYear: number;
  makeName: string;
  modelName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  expiresAt: string;
  createdAt: string;
  processedAt: string;
  queueStatus: string;
  hasQuoted: boolean;
  totalQuotes: number;
}
interface QuoteFormData {
  price: number;
  availability: string;
  deliveryTime: string;
  notes: string;
  warranty: string;
  condition: string;
  partCondition: string;
}

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

// View Details Modal Component
function ViewDetailsModal({ request, isOpen, onClose }: { 
  request: SellerRequest | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  if (!isOpen || !request) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-JM', {
      style: 'currency',
      currency: 'JMD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{request.partName}</h2>
            <p className="text-gray-600">{request.makeName} {request.modelName} {request.vehicleYear}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Request Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Request Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Part Name</p>
                <p className="text-gray-800">{request.partName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Vehicle</p>
                <p className="text-gray-800">{request.makeName} {request.modelName} {request.vehicleYear}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Description</p>
                <p className="text-gray-800">{request.description || 'No description provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Budget</p>
                <p className="text-green-600 font-semibold">{formatCurrency(request.budget)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Location</p>
                <p className="text-gray-800 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {request.parish}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Urgency</p>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  request.urgency === 'high' ? 'bg-red-100 text-red-800' :
                  request.urgency === 'medium' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {request.urgency}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Expires</p>
                <p className="text-gray-800 flex items-center gap-1">
                  <CalendarDays className="w-4 h-4" />
                  {new Date(request.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Quotes</p>
                <p className="text-blue-600 font-semibold">{request.totalQuotes}</p>
              </div>
            </div>
          </div>

          {/* Buyer Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Buyer Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Name</p>
                <p className="text-gray-800">{request.buyerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-gray-800 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {request.buyerEmail}
                </p>
              </div>
              {request.buyerPhone && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                  <p className="text-gray-800 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {request.buyerPhone}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Quote Status
            </h3>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              request.hasQuoted 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {request.hasQuoted ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-semibold">Quote Submitted</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold">Pending Quote</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {!request.hasQuoted && (
            <Link
              href={`/seller/quote/${request.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Submit Quote
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Submit Quote Modal Component
function SubmitQuoteModal({ request, isOpen, onClose, onSubmit }: {
  request: SellerRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quoteData: QuoteFormData) => Promise<void>;
}) {
  const [formData, setFormData] = useState<QuoteFormData>({
    price: 0,
    availability: 'in_stock',
    deliveryTime: '',
    notes: '',
    warranty: '30 days',
    condition: 'excellent',
    partCondition: 'new'
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        price: 0,
        availability: 'in_stock',
        deliveryTime: '',
        notes: '',
        warranty: '30 days',
        condition: 'excellent',
        partCondition: 'new'
      });
    } catch (error) {
      console.error('Error submitting quote:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Submit Quote</h2>
            <p className="text-gray-600 text-sm">{request.partName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Price (JMD)
            </label>
            <input
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your price"
            />
            <p className="text-xs text-gray-500 mt-1">Buyer's budget: {new Intl.NumberFormat('en-JM', { style: 'currency', currency: 'JMD' }).format(request.budget)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Availability
            </label>
            <select
              required
              value={formData.availability}
              onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="in_stock">In Stock</option>
              <option value="available_soon">Available Soon</option>
              <option value="need_to_order">Need to Order</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Time
            </label>
            <select
              required
              value={formData.deliveryTime}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select delivery time</option>
              <option value="same_day">Same Day</option>
              <option value="1-2 days">1-2 Business Days</option>
              <option value="3-5 days">3-5 Business Days</option>
              <option value="1 week">1 Week</option>
              <option value="2 weeks">2 Weeks</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Part Condition
            </label>
            <select
              required
              value={formData.partCondition}
              onChange={(e) => setFormData(prev => ({ ...prev, partCondition: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="new">New</option>
              <option value="used_excellent">Used - Excellent</option>
              <option value="used_good">Used - Good</option>
              <option value="used_fair">Used - Fair</option>
              <option value="refurbished">Refurbished</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warranty
            </label>
            <select
              value={formData.warranty}
              onChange={(e) => setFormData(prev => ({ ...prev, warranty: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="no_warranty">No Warranty</option>
              <option value="30 days">30 Days</option>
              <option value="3 months">3 Months</option>
              <option value="6 months">6 Months</option>
              <option value="1 year">1 Year</option>
              <option value="2 years">2 Years</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional information about the part..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Quote
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<SellerRequest | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [submitQuoteOpen, setSubmitQuoteOpen] = useState(false);

  // Fetch requests
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const authData = getAuthData();
      
      if (!authData?.token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/seller/requests', {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setRequests(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [activeTab]);

  // Handle view details
  const handleViewDetails = (request: SellerRequest) => {
    setSelectedRequest(request);
    setViewDetailsOpen(true);
  };

  // Handle submit quote
  const handleSubmitQuote = async (quoteData: QuoteFormData) => {
    if (!selectedRequest) return;

    const authData = getAuthData();
    if (!authData?.token) {
      alert('Authentication required');
      return;
    }

    try {
      const response = await fetch('/api/seller/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          ...quoteData
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setRequests(prev => prev.map(req => 
          req.id === selectedRequest.id ? { ...req, hasQuoted: true } : req
        ));
        alert('Quote submitted successfully!');
      } else {
        alert('Failed to submit quote: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Failed to submit quote. Please try again.');
    }
  };

  // Open submit quote modal
  const handleOpenSubmitQuote = (request: SellerRequest) => {
    setSelectedRequest(request);
    setSubmitQuoteOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-blue-100 text-blue-800';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-JM', {
      style: 'currency',
      currency: 'JMD'
    }).format(amount);
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.makeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.modelName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'unquoted' && !request.hasQuoted) ||
                         (filterStatus === 'quoted' && request.hasQuoted);
    
    return matchesSearch && matchesFilter;
  });

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
                href="/seller/add-part"
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
                    {requests.filter(r => !r.hasQuoted).length}
                  </span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
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
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading requests...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.map((request) => (
                      <div key={request.id} className="bg-white rounded-lg shadow-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-800">{request.partName}</h3>
                              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.urgency)}`}>
                                {request.urgency}
                              </div>
                              {request.hasQuoted && (
                                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                  Quoted
                                </div>
                              )}
                            </div>
                            <p className="text-gray-600 mb-2">
                              {request.makeName} {request.modelName} {request.vehicleYear} • {request.buyerName}
                            </p>
                            <p className="text-gray-700 mb-4">{request.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Request ID: REQ-{request.id}</p>
                            <p className="text-sm text-gray-500">Received: {timeAgo(request.processedAt)}</p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Budget</p>
                            <p className="text-green-600 font-bold">{formatCurrency(request.budget)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Location</p>
                            <p className="text-gray-600">{request.parish}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Expires</p>
                            <p className="text-red-600">{new Date(request.expiresAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Quotes</p>
                            <p className="text-blue-600 font-bold">{request.totalQuotes}</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          {!request.hasQuoted ? (
                            <button 
                              onClick={() => handleOpenSubmitQuote(request)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                            >
                              <Send className="w-4 h-4" />
                              Submit Quote
                            </button>
                          ) : (
                            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                              <Edit className="w-4 h-4" />
                              Edit Quote
                            </button>
                          )}
                          <button 
                            onClick={() => handleViewDetails(request)}
                            className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {filteredRequests.length === 0 && (
                      <div className="text-center py-12 bg-white rounded-lg shadow-lg">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">No Requests Found</h4>
                        <p className="text-gray-600">
                          {searchQuery || filterStatus !== 'all' 
                            ? 'Try adjusting your search or filter criteria'
                            : 'No part requests available at the moment'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ViewDetailsModal
        request={selectedRequest}
        isOpen={viewDetailsOpen}
        onClose={() => setViewDetailsOpen(false)}
      />

      <SubmitQuoteModal
        request={selectedRequest}
        isOpen={submitQuoteOpen}
        onClose={() => setSubmitQuoteOpen(false)}
        onSubmit={handleSubmitQuote}
      />
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