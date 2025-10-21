'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  MessageSquare,
  DollarSign,
  Package,
  Phone,
  Mail,
  MapPin,
  Search,
  Filter,
  Calendar,
  Star,
  BarChart3,
  Loader2
} from 'lucide-react';

interface AdminStats {
  totalSuppliers: number;
  pendingApplications: number;
  activeRequests: number;
  monthlyRevenue: number;
  urgentApplications: number;
  newSuppliersThisMonth: number;
}

interface SupplierApplication {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  location: string;
  businessType: string;
  yearsInBusiness: string;
  specializations: string[];
  membershipPlan: string;
  dateSubmitted: string;
  documentsUploaded: string[];
  status: string;
  urgency: string;
  revenue: string;
}

interface VerifiedSupplier {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  location: string;
  membershipPlan: string;
  dateJoined: string;
  rating: string;
  reviews: number;
  revenue: string;
  status: string;
  lastActive: string;
  totalQuotes: number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [applications, setApplications] = useState<SupplierApplication[]>([]);
  const [suppliers, setSuppliers] = useState<VerifiedSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Get token from localStorage or your auth context
 const getToken = () => {
  // Check multiple possible token locations
  if (typeof window !== 'undefined') {
    // Try different localStorage keys
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') ||
                  localStorage.getItem('accessToken') ||
                  sessionStorage.getItem('token') ||
                  sessionStorage.getItem('authToken');
    
    if (token) {
      console.log('🔐 Token found:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('⚠️ No token found in storage');
      // Agar token nahi mila toh login page redirect karo
      window.location.href = '/login';
      return null;
    }
  }
  return null;
};


  // Fetch data based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab, searchQuery, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      if (activeTab === 'overview') {
        const [statsRes] = await Promise.all([
          fetch('/api/admin/stats', { headers })
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }
      }

      if (activeTab === 'applications') {
        const params = new URLSearchParams();
        if (filterStatus !== 'all') params.append('status', filterStatus);
        if (searchQuery) params.append('search', searchQuery);

        const applicationsRes = await fetch(`/api/admin/applications?${params}`, { headers });
        
        if (applicationsRes.ok) {
          const applicationsData = await applicationsRes.json();
          setApplications(applicationsData.data);
        }
      }

      if (activeTab === 'suppliers') {
        const suppliersRes = await fetch('/api/admin/suppliers', { headers });
        
        if (suppliersRes.ok) {
          const suppliersData = await suppliersRes.json();
          setSuppliers(suppliersData.data);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (applicationId: string) => {
    try {
      setProcessingAction(applicationId);
      const token = getToken();

      const response = await fetch('/api/admin/approve-supplier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          applicationId,
          action: 'approve'
        })
      });

      if (response.ok) {
        alert('✅ Application approved! Supplier will be notified via email.');
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert('❌ Error approving application. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setProcessingAction(applicationId);
      const token = getToken();

      const response = await fetch('/api/admin/approve-supplier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          applicationId,
          action: 'reject',
          reason
        })
      });

      if (response.ok) {
        alert('❌ Application rejected. Supplier will be notified via email.');
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('❌ Error rejecting application. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'documents_review':
        return 'bg-blue-100 text-blue-800';
      case 'pending_documents':
        return 'bg-orange-100 text-orange-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    return urgency === 'urgent' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500';
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-JM', {
      style: 'currency',
      currency: 'JMD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Stats data derived from real API
  const statsData = stats ? [
    {
      icon: <Users className="w-6 h-6" />,
      label: 'Total Suppliers',
      value: stats.totalSuppliers.toString(),
      change: `+${stats.newSuppliersThisMonth} this month`,
      changeType: 'positive' as const
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: 'Pending Applications',
      value: stats.pendingApplications.toString(),
      change: `${stats.urgentApplications} urgent`,
      changeType: stats.urgentApplications > 0 ? 'warning' : 'positive' as const
    },
    {
      icon: <Package className="w-6 h-6" />,
      label: 'Active Requests',
      value: stats.activeRequests.toString(),
      change: 'Live count',
      changeType: 'positive' as const
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue),
      change: 'Real-time tracking',
      changeType: 'positive' as const
    }
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">PartsFinda Platform Management</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                Export Report
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                Send Notifications
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {loading && !stats ? (
            // Loading skeleton
            Array(4).fill(0).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-gray-200"></div>
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : (
            statsData.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${
                    stat.changeType === 'positive' ? 'bg-green-100' :
                    stat.changeType === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    <div className={`${
                      stat.changeType === 'positive' ? 'text-green-600' :
                      stat.changeType === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                    }`}>
                      {stat.icon}
                    </div>
                  </div>
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
                <div className={`text-xs font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' :
                  stat.changeType === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                }`}>
                  {stat.change}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'applications', label: 'Supplier Applications', icon: <FileText className="w-4 h-4" /> },
                { id: 'suppliers', label: 'Verified Suppliers', icon: <Shield className="w-4 h-4" /> },
                { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
                { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Platform Overview</h3>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                      <h4 className="font-semibold text-yellow-800">Urgent Actions Required</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-yellow-700">
                      <li>• {stats?.urgentApplications || 0} applications require urgent review</li>
                      <li>• 3 suppliers have incomplete documentation</li>
                      <li>• 12 customer complaints need response</li>
                    </ul>
                    <button 
                      onClick={() => setActiveTab('applications')}
                      className="mt-4 text-yellow-800 font-medium text-sm hover:text-yellow-900"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                      <h4 className="font-semibold text-green-800">Recent Growth</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-green-700">
                      <li>• {stats?.newSuppliersThisMonth || 0} new suppliers this month</li>
                      <li>• {stats?.activeRequests || 0} active part requests</li>
                      <li>• Real-time revenue tracking</li>
                    </ul>
                    <button className="mt-4 text-green-800 font-medium text-sm hover:text-green-900">
                      View Details →
                    </button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="w-6 h-6 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">Platform Activity</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li>• {stats?.totalSuppliers || 0} verified suppliers</li>
                      <li>• {stats?.pendingApplications || 0} pending applications</li>
                      <li>• Real-time analytics</li>
                    </ul>
                    <button 
                      onClick={() => setActiveTab('analytics')}
                      className="mt-4 text-blue-800 font-medium text-sm hover:text-blue-900"
                    >
                      View Analytics →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Supplier Applications</h3>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search applications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="documents_review">Documents Review</option>
                      <option value="pending_documents">Pending Documents</option>
                    </select>
                  </div>
                </div>

                {/* Applications List */}
                <div className="space-y-4">
                  {loading ? (
                    // Loading skeleton for applications
                    Array(3).fill(0).map((_, index) => (
                      <div key={index} className="bg-white border rounded-lg p-6 animate-pulse">
                        <div className="grid lg:grid-cols-4 gap-6">
                          <div className="lg:col-span-2 space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="grid md:grid-cols-2 gap-4">
                              {Array(4).fill(0).map((_, i) => (
                                <div key={i} className="space-y-2">
                                  <div className="h-3 bg-gray-200 rounded"></div>
                                  <div className="h-4 bg-gray-200 rounded"></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : applications.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">No Applications Found</h4>
                      <p className="text-gray-600">There are no supplier applications matching your criteria.</p>
                    </div>
                  ) : (
                    applications.map((app) => (
                      <div key={app.id} className={`bg-white border rounded-lg p-6 ${getUrgencyColor(app.urgency)}`}>
                        <div className="grid lg:grid-cols-4 gap-6">
                          <div className="lg:col-span-2">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-gray-800">{app.businessName}</h4>
                                <p className="text-gray-600">{app.ownerName}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {app.email}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {app.phone}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(app.status)}`}>
                                  {app.status.replace('_', ' ')}
                                </span>
                                {app.urgency === 'urgent' && (
                                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                                    Urgent
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Location</p>
                                <p className="font-medium flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {app.location}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Business Type</p>
                                <p className="font-medium">{app.businessType}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Experience</p>
                                <p className="font-medium">{app.yearsInBusiness} years</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Membership Plan</p>
                                <p className="font-medium capitalize">{app.membershipPlan} - {app.revenue}</p>
                              </div>
                            </div>

                            {app.specializations && app.specializations.length > 0 && (
                              <div className="mt-4">
                                <p className="text-gray-500 text-sm mb-2">Specializations</p>
                                <div className="flex flex-wrap gap-2">
                                  {app.specializations.map((spec, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                      {spec}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="text-gray-500 text-sm mb-2">Documents</p>
                            <div className="space-y-1">
                              {['business_license', 'tax_certificate', 'insurance'].map((doc) => (
                                <div key={doc} className="flex items-center justify-between">
                                  <span className="text-sm">{doc.replace('_', ' ')}</span>
                                  {app.documentsUploaded.includes(doc) ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="mt-4 text-sm">
                              <p className="text-gray-500">Submitted</p>
                              <p className="font-medium">{new Date(app.dateSubmitted).toLocaleDateString()}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => alert(`Viewing application details for ${app.businessName}`)}
                              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>

                            <button
                              onClick={() => alert(`Downloading documents for ${app.businessName}`)}
                              className="flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Documents
                            </button>

                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleApproveApplication(app.id)}
                                disabled={processingAction === app.id}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-2 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                              >
                                {processingAction === app.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : null}
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectApplication(app.id)}
                                disabled={processingAction === app.id}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-2 rounded text-xs font-semibold transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'suppliers' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Verified Suppliers</h3>

                <div className="space-y-4">
                  {loading ? (
                    // Loading skeleton for suppliers
                    Array(2).fill(0).map((_, index) => (
                      <div key={index} className="bg-white border rounded-lg p-6 animate-pulse">
                        <div className="grid lg:grid-cols-4 gap-6">
                          <div className="lg:col-span-2 space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="grid md:grid-cols-2 gap-4">
                              {Array(4).fill(0).map((_, i) => (
                                <div key={i} className="space-y-2">
                                  <div className="h-3 bg-gray-200 rounded"></div>
                                  <div className="h-4 bg-gray-200 rounded"></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : suppliers.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">No Verified Suppliers</h4>
                      <p className="text-gray-600">There are no verified suppliers in the system yet.</p>
                    </div>
                  ) : (
                    suppliers.map((supplier) => (
                      <div key={supplier.id} className="bg-white border rounded-lg p-6">
                        <div className="grid lg:grid-cols-4 gap-6">
                          <div className="lg:col-span-2">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-gray-800">{supplier.businessName}</h4>
                                <p className="text-gray-600">{supplier.ownerName}</p>
                                <p className="text-sm text-gray-500">{supplier.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(supplier.status)}`}>
                                  {supplier.status}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-sm font-medium">{supplier.rating}</span>
                                  <span className="text-xs text-gray-500">({supplier.reviews} reviews)</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Location</p>
                                <p className="font-medium">{supplier.location}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Member Since</p>
                                <p className="font-medium">{new Date(supplier.dateJoined).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Membership</p>
                                <p className="font-medium capitalize">{supplier.membershipPlan} - {supplier.revenue}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Quotes Submitted</p>
                                <p className="font-medium">{supplier.totalQuotes}</p>
                              </div>
                            </div>
                          </div>

                          <div className="lg:col-span-2 flex items-center justify-end gap-2">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                              View Profile
                            </button>
                            <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                              Send Message
                            </button>
                            <button className="border border-red-300 hover:bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                              Suspend
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {(activeTab === 'analytics' || activeTab === 'messages') && (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  {activeTab === 'analytics' ? (
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  ) : (
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  {activeTab === 'analytics' ? 'Analytics Dashboard' : 'Admin Messages'}
                </h4>
                <p className="text-gray-600">
                  {activeTab === 'analytics'
                    ? 'Detailed analytics and reporting features coming soon.'
                    : 'Admin messaging system will be available here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}