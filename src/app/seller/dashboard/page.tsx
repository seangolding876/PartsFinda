'use client';

import { useState, useEffect, Suspense } from 'react';
import { Search, Filter, Plus, Eye, MessageCircle, Clock, CheckCircle, XCircle, Star, MapPin, Calendar, Package, TrendingUp, User, Settings, Bell, Heart, DollarSign, BarChart3, Truck, AlertCircle, Edit, Send, Crown, Zap, CreditCard } from 'lucide-react';
import Link from 'next/link';
import RequestDetailsModal from '@/components/RequestDetailsModal';
import QuoteModal from '@/components/QuoteModal';
import { useToast } from '@/hooks/useToast';
import { useWelcomeMessage } from '@/hooks/useWelcomeMessage';

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

interface SellerRequest {
  id: number;
  queueId: string;
  partName: string;
  partNumber?: string;
  description: string;
  budget: number;
  parish: string;
  condition: string;
  urgency: string;
  vehicleYear: number;
  makeName: string;
  modelName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  dateReceived: string;
  expiresAt: string;
  queueStatus: string;
  scheduledDelivery: string;
  processedAt?: string;
  totalQuotes: number;
  hasQuoted: boolean;
  quoted: boolean;
  isReject: boolean;
}

interface SellerStats {
  activeListings: number;
  pendingQuotes: number;
  completedOrders: number;
  monthlyRevenue: number;
  totalQuotes: number;
  acceptanceRate: number;
  avgResponseTime: number;
}

interface SellerSubscription {
  plan_name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
  status: string;
  request_delay_hours?: number;
  features?: string[];
}

interface SellerProfile {
  name: string;
  email: string;
  rating: number;
  reviews: number;
  subscription: SellerSubscription | null;
}

function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingQuote, setSubmittingQuote] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SellerRequest | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState<SellerRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile>({
    name: 'Your Business',
    email: '',
    rating: 0,
    reviews: 0,
    subscription: null
  });
  const [sellerLoading, setSellerLoading] = useState(true);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  // ✅ Toast hook use karein
  const { successmsg, errormsg, infomsg } = useToast();

  // Welcome Message First Time
  useWelcomeMessage();

  // Real-time data tracking ke liye
  const [lastRequestCount, setLastRequestCount] = useState(0);
  const [lastStats, setLastStats] = useState<SellerStats | null>(null);

  // Fetch seller profile with subscription details
  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        console.log('🔍 Fetching seller profile...');

        const authData = getAuthData();
        if (!authData?.token) {
          console.log('❌ No auth token');
          setSellerLoading(false);
          return;
        }

        const response = await fetch('/api/profile/seller', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ API Result:', result);

          if (result.success) {
            // Ensure rating is a number
            const profileData = {
              ...result.data,
              rating: typeof result.data.rating === 'string' 
                ? parseFloat(result.data.rating) 
                : result.data.rating
            };
            
            setSellerProfile(profileData);
            console.log('🎉 Seller profile set successfully');
          } else {
            console.error('❌ API Error:', result.error);
            errormsg(result.error || 'Failed to load seller profile');
          }
        } else {
          console.error('❌ Fetch failed with status:', response.status);
          errormsg('Failed to fetch seller profile');
        }
      } catch (error) {
        console.error('❌ Error fetching seller profile:', error);
        errormsg('Error loading seller profile');
      } finally {
        setSellerLoading(false);
      }
    };

    fetchSellerProfile();
  }, []);

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const authData = getAuthData();

      if (!authData?.token) {
        errormsg('No authentication token found');
        setLoading(false);
        return;
      }

      try {
        if (activeTab === 'overview' || activeTab === 'requests') {
          // Fetch requests
          const requestsResponse = await fetch(`/api/seller/requests?action=getRequests&status=${filterStatus === 'all' ? 'all' : 'pending'}`, {
            headers: {
              'Authorization': `Bearer ${authData.token}`
            }
          });

          if (requestsResponse.ok) {
            const requestsResult = await requestsResponse.json();
            if (requestsResult.success) {
              // ✅ Real-time notification for new requests
              if (requests.length > 0 && requestsResult.data.length > requests.length) {
                const newRequests = requestsResult.data.length - requests.length;
                infomsg(`${newRequests} new request${newRequests > 1 ? 's' : ''} available`);
              }

              setRequests(requestsResult.data);
            } else {
              errormsg(requestsResult.error || 'Failed to load requests');
            }
          } else {
            errormsg('Failed to fetch requests');
          }

          // Fetch stats for overview
          if (activeTab === 'overview') {
            const statsResponse = await fetch('/api/seller/stats', {
              headers: {
                'Authorization': `Bearer ${authData.token}`
              }
            });

            if (statsResponse.ok) {
              const statsResult = await statsResponse.json();
              if (statsResult.success) {
                // ✅ Real-time stats comparison
                if (lastStats && statsResult.data.monthlyRevenue > lastStats.monthlyRevenue) {
                  const increase = statsResult.data.monthlyRevenue - lastStats.monthlyRevenue;
                  successmsg(`Revenue increased by ${formatCurrency(increase)} this month!`);
                }

                setStats(statsResult.data);
                setLastStats(statsResult.data);
              } else {
                errormsg(statsResult.error || 'Failed to load stats');
              }
            } else {
              errormsg('Failed to fetch stats');
            }
          }
        }
      } catch (error) {
        errormsg('Error fetching data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, filterStatus]);

  // ✅ Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (cancellingSubscription || !sellerProfile.subscription?.is_active) return;

    const confirmCancel = window.confirm(
      'Are you sure you want to cancel your subscription? You will lose access to premium features immediately.'
    );

    if (!confirmCancel) return;

    try {
      setCancellingSubscription(true);
      const authData = getAuthData();

      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        successmsg('Subscription canceled successfully!');
        
        // Update local state
        setSellerProfile(prev => ({
          ...prev,
          subscription: prev.subscription ? {
            ...prev.subscription,
            is_active: false,
            status: 'cancelled'
          } : null
        }));

        // Refresh data
        const fetchSellerProfile = async () => {
          const authData = getAuthData();
          const response = await fetch('/api/profile/seller', {
            headers: {
              'Authorization': `Bearer ${authData.token}`
            }
          });
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setSellerProfile(result.data);
            }
          }
        };
        fetchSellerProfile();

      } else {
        throw new Error(result.error || 'Failed to cancel subscription');
      }

    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      errormsg(error.message || 'Failed to cancel subscription');
    } finally {
      setCancellingSubscription(false);
    }
  };

  // ✅ Get subscription benefits based on plan
  const getSubscriptionBenefits = () => {
    const subscription = sellerProfile.subscription;
    
    if (!subscription || !subscription.is_active) {
      return {
        icon: <Zap className="w-5 h-5" />,
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        benefits: ['Early access to part requests', 'Standard response time', 'Basic seller features'],
        upgradeMessage: 'Upgrade for premium benefits'
      };
    }

    switch (subscription.plan_name?.toLowerCase()) {
      case 'premium':
        return {
          icon: <Crown className="w-5 h-5 text-yellow-600" />,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          benefits: ['First access to all part requests', '1-hour early access', 'Premium badge', 'Priority support'],
          upgradeMessage: null
        };
      case 'pro':
        return {
          icon: <Zap className="w-5 h-5 text-purple-600" />,
          color: 'text-purple-600',
          bg: 'bg-purple-100',
          benefits: ['Early access to part requests', '4-hour early access', 'Pro badge', 'Enhanced visibility'],
          upgradeMessage: null
        };
      default:
        return {
          icon: <CreditCard className="w-5 h-5 text-blue-600" />,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          benefits: ['Standard access to part requests', 'Regular response time', 'Basic features'],
          upgradeMessage: null
        };
    }
  };

  // ✅ Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-JM', {
      style: 'currency',
      currency: 'JMD'
    }).format(amount);
  };

  // ✅ Time ago utility
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Rest of your existing functions (handleSubmitQuote, openQuoteModal, etc.)
  const handleSubmitQuote = async (quoteData: any) => {
    const authData = getAuthData();
    if (!authData?.token) {
      errormsg('Authentication required');
      return;
    }

    setSubmittingQuote(quoteData.requestId);

    try {
      const response = await fetch('/api/seller/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify(quoteData)
      });

      const result = await response.json();

      if (result.success) {
        setRequests(prev => prev.map(req =>
          req.id === quoteData.requestId ? {
            ...req,
            hasQuoted: true,
            quoted: true,
            totalQuotes: req.totalQuotes + 1
          } : req
        ));

        setShowQuoteModal(false);
        setSelectedRequest(null);
        successmsg(`Quote submitted successfully for ${quoteData.price}! Buyer notified.`);
      } else {
        errormsg(result.error || 'Failed to submit quote');
      }
    } catch (error) {
      errormsg('Failed to submit quote. Please try again.');
      console.error('Error submitting quote:', error);
    } finally {
      setSubmittingQuote(null);
    }
  };

  const openQuoteModal = (request: SellerRequest) => {
    setSelectedRequest(request);
    setShowQuoteModal(true);
    infomsg(`Preparing quote for ${request.partName}`);
  };

  const openDetailsModal = (request: SellerRequest) => {
    setSelectedRequestForDetails(request);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processed': return 'bg-green-100 text-green-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter requests based on search and filter
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.makeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.modelName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'unquoted' && !request.hasQuoted) ||
      (filterStatus === 'quoted' && request.hasQuoted);

    return matchesSearch && matchesFilter;
  });

  // Stats for display
  const displayStats = [
    {
      icon: <Package className="w-6 h-6" />,
      label: 'Active Listings',
      value: stats?.activeListings.toString() || '0',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      trend: '+5 this week'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      label: 'Pending Quotes',
      value: filteredRequests.filter(r => !r.hasQuoted && !r.isReject).length.toString(),
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      label: 'Completed Orders',
      value: stats?.completedOrders.toString() || '0',
      color: 'text-green-600',
      bg: 'bg-green-100',
      trend: '+8 this month'
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Monthly Revenue',
      value: formatCurrency(stats?.monthlyRevenue || 0),
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      trend: '+15% vs last month'
    }
  ];

  const subscriptionBenefits = getSubscriptionBenefits();



  const handleReject = async (request: SellerRequest) => {
    setLoading(true);

    try {
      const authData = getAuthData(); // From localStorage
      const res = await fetch('/api/seller/reject-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({ request_id: request.queueId })
      });

      const result = await res.json();

      if (result.success) {
        successmsg('You have rejected the request successfully.');
        setRequests(prev =>
          prev.map(r => r.id === request.id ? { ...r, isReject: true } : r)
        );

        const fetchData = async () => {
          const authData = getAuthData();
          const response = await fetch(`/api/seller/requests?action=getRequests&status=${filterStatus === 'all' ? 'all' : 'pending'}`, {
            headers: { 'Authorization': `Bearer ${authData.token}` }
          });
          if (response.ok) {
            const result = await response.json();
            if (result.success) setRequests(result.data);
          }
        };
        fetchData();

      } else {
        // alert(result.error || 'Failed to reject request');
        errormsg(result.error || 'Failed to reject request');
      }

    } catch (err) {
      console.error(err);
      errormsg("something went wrong while rejecting the request.");
    } finally {
      setLoading(false);
    }
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
                href="/seller/subscription"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                onClick={() => infomsg('Checking subscription options...')}
              >
                <Crown className="w-5 h-5" />
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
                  <h3 className="font-semibold text-gray-800">
                    {sellerLoading ? 'Loading...' : sellerProfile.name}
                  </h3>
                  {!sellerLoading && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
          {(sellerProfile.rating || 0).toFixed(1)} ({sellerProfile.reviews || 0} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ SUBSCRIPTION STATUS SECTION - Yahan Add Kiya Hai */}
              <div className="mb-6">
                <div className={`p-4 rounded-lg border ${
                  sellerProfile.subscription?.is_active 
                    ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
                    : 'bg-gradient-to-r from-gray-50 to-orange-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-full ${subscriptionBenefits.bg}`}>
                      <div className={subscriptionBenefits.color}>
                        {subscriptionBenefits.icon}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">
                        {sellerProfile.subscription?.is_active 
                          ? `${sellerProfile.subscription.plan_name} Plan`
                          : 'Free Plan'
                        }
                      </h4>
                      <p className="text-xs text-gray-600">
                        {sellerProfile.subscription?.is_active 
                          ? `Active • Cancel anytime`
                          : 'Upgrade for early access'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Subscription Benefits */}
                  <ul className="space-y-2 mb-4">
                    {subscriptionBenefits.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs text-gray-700">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {sellerProfile.subscription?.is_active ? (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancellingSubscription}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {cancellingSubscription ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-1 border-white"></div>
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Cancel Plan
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        href="/seller/subscription"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-xs font-semibold transition-colors text-center flex items-center justify-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        Upgrade Now
                      </Link>
                    )}
                    
                    <Link
                      href="/seller/subscription"
                      className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-3 rounded text-xs font-semibold transition-colors text-center"
                    >
                      View Plans
                    </Link>
                  </div>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setActiveTab('overview');
                    infomsg('Loading overview...');
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-blue-100 text-blue-600 font-semibold' : 'hover:bg-gray-100'
                    }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => {
                    setActiveTab('requests');
                    infomsg('Loading part requests...');
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${activeTab === 'requests' ? 'bg-blue-100 text-blue-600 font-semibold' : 'hover:bg-gray-100'
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
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6">
                  {displayStats.map((stat, index) => (
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
                      onClick={() => {
                        setActiveTab('requests');
                        infomsg('Showing pending requests...');
                      }}
                      className="bg-orange-50 border border-orange-200 p-4 rounded-lg hover:bg-orange-100 transition-colors text-left"
                    >
                      <AlertCircle className="w-8 h-8 text-orange-600 mb-3" />
                      <h4 className="font-semibold text-gray-800">Pending Requests</h4>
                      <p className="text-sm text-gray-600">{requests.filter(r => !r.hasQuoted).length} requests waiting for quotes</p>
                    </button>
                    <Link
                      href="/seller/add-part"
                      className="bg-green-50 border border-green-200 p-4 rounded-lg hover:bg-green-100 transition-colors text-left block"
                      onClick={() => infomsg('Opening add part form...')}
                    >
                      <Plus className="w-8 h-8 text-green-600 mb-3" />
                      <h4 className="font-semibold text-gray-800">Add New Part</h4>
                      <p className="text-sm text-gray-600">Expand your inventory</p>
                    </Link>
                    <Link
                      href="/seller/subscription"
                      className="bg-blue-50 border border-blue-200 p-4 rounded-lg hover:bg-blue-100 transition-colors text-left block"
                      onClick={() => infomsg('Checking subscription options...')}
                    >
                      <TrendingUp className="w-8 h-8 text-blue-600 mb-3" />
                      <h4 className="font-semibold text-gray-800">Upgrade Plan</h4>
                      <p className="text-sm text-gray-600">Get more features</p>
                    </Link>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Requests</h3>
                  <div className="space-y-4">
                    {requests.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{request.partName}</h4>
                            <p className="text-sm text-gray-600">{request.buyerName} • {request.makeName} {request.modelName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${request.hasQuoted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {request.hasQuoted ? 'Quoted' : 'New Request'}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{timeAgo(request.processedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Rest of your existing requests tab code remains the same */}
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
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (e.target.value) {
                            infomsg(`Searching for "${e.target.value}"...`);
                          }
                        }}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        infomsg(`Filtering by ${e.target.value === 'all' ? 'all requests' : e.target.value}...`);
                      }}
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
                            <p className="text-gray-600 mb-2">{request.makeName} {request.modelName} {request.vehicleYear} • {request.buyerName}</p>
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
                            <>
                              <button
                                onClick={() => openQuoteModal(request)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                              >
                                <Send className="w-4 h-4" />
                                Submit Quote
                              </button>
                              <button
                                onClick={() => handleReject(request)}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:bg-gray-400"
                              >
                                {loading ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-1 border-white"></div>
                                    Rejecting...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4" />
                                    I don't have this part (Reject)
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                              <Edit className="w-4 h-4" />
                              View Quote
                            </button>
                          )}
                          <button
                            onClick={() => openDetailsModal(request)}
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

      {/* MODALS */}
      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => {
          setShowQuoteModal(false);
          setSelectedRequest(null);
          infomsg('Quote modal closed');
        }}
        onSubmit={handleSubmitQuote}
        request={selectedRequest}
        loading={submittingQuote === selectedRequest?.id}
      />

      <RequestDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedRequestForDetails(null);
        }}
        request={selectedRequestForDetails}
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