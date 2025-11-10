'use client';

import { useState, useEffect } from 'react';

interface SellerUser {
  id: number;
  email: string;
  name: string;
  role: 'seller';
  phone: string;
  email_verified: boolean;
  created_at: string;
  avg_rating: number;
  total_ratings: number;
  business_name?: string;
  owner_name?: string;
  business_type?: string;
  business_registration_number?: string;
  tax_id?: string;
  years_in_business?: number;
  address?: string;
  parish?: string;
  city?: string;
  postal_code?: string;
  business_phone?: string;
  business_email?: string;
  website?: string;
  specializations?: string[];
  vehicle_brands?: string[];
  part_categories?: string[];
  verified_status: string;
  rejection_reason?: string;
  profile_completion_percentage?: number;
  last_login?: string;
}

interface SellerStats {
  total_part_requests: number;
  total_quotes_sent: number;
  accepted_quotes: number;
  total_revenue: number;
  active_subscription: any;
  payment_history: any[];
}

interface SellerDetailsModalProps {
  seller: SellerUser | null;
  onClose: () => void;
}

export default function SellerDetailsModal({ seller, onClose }: SellerDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'payments' | 'performance'>('profile');
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (seller) {
      fetchSellerStats();
    }
  }, [seller]);

  const fetchSellerStats = async () => {
    if (!seller) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${seller.id}/stats?role=seller`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching seller stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!seller) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{seller.business_name || seller.name}</h2>
              <p className="text-gray-600">{seller.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'profile', name: 'Profile' },
              { id: 'subscription', name: 'Subscription' },
              { id: 'payments', name: 'Payments' },
              { id: 'performance', name: 'Performance' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab seller={seller} />}
          {activeTab === 'subscription' && <SubscriptionTab seller={seller} stats={stats} loading={loading} />}
          {activeTab === 'payments' && <PaymentsTab stats={stats} loading={loading} />}
          {activeTab === 'performance' && <PerformanceTab stats={stats} loading={loading} />}
        </div>
      </div>
    </div>
  );
}

// Profile Tab Component
function ProfileTab({ seller }: { seller: SellerUser }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-500">Full Name</label>
            <p className="text-sm text-gray-900">{seller.name}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-sm text-gray-900">{seller.email}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Phone</label>
            <p className="text-sm text-gray-900">{seller.phone || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Email Verified</label>
            <p className="text-sm text-gray-900">
              {seller.email_verified ? 'Yes' : 'No'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Profile Completion</label>
            <div className="flex items-center space-x-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${seller.profile_completion_percentage || 0}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{seller.profile_completion_percentage || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-500">Business Name</label>
            <p className="text-sm text-gray-900">{seller.business_name || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Owner Name</label>
            <p className="text-sm text-gray-900">{seller.owner_name || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Business Type</label>
            <p className="text-sm text-gray-900">{seller.business_type || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Tax ID</label>
            <p className="text-sm text-gray-900">{seller.tax_id || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Years in Business</label>
            <p className="text-sm text-gray-900">{seller.years_in_business || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Verified Status</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              seller.verified_status === 'verified' 
                ? 'bg-green-100 text-green-800'
                : seller.verified_status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {seller.verified_status || 'pending'}
            </span>
          </div>

          {seller.rejection_reason && (
            <div>
              <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
              <p className="text-sm text-red-600">{seller.rejection_reason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-500">Address</label>
            <p className="text-sm text-gray-900">{seller.address || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Parish</label>
            <p className="text-sm text-gray-900">{seller.parish || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">City</label>
            <p className="text-sm text-gray-900">{seller.city || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Business Phone</label>
            <p className="text-sm text-gray-900">{seller.business_phone || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Business Email</label>
            <p className="text-sm text-gray-900">{seller.business_email || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Website</label>
            <p className="text-sm text-gray-900">{seller.website || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Specializations */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Specializations</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-500">Vehicle Brands</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {seller.vehicle_brands?.map((brand, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {brand}
                </span>
              )) || <p className="text-sm text-gray-500">None specified</p>}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Part Categories</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {seller.part_categories?.map((category, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {category}
                </span>
              )) || <p className="text-sm text-gray-500">None specified</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Specializations</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {seller.specializations?.map((spec, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {spec}
                </span>
              )) || <p className="text-sm text-gray-500">None specified</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subscription Tab Component
function SubscriptionTab({ seller, stats, loading }: { seller: SellerUser; stats: SellerStats | null; loading: boolean }) {
  if (loading) {
    return <div className="text-center py-4">Loading subscription data...</div>;
  }

  const subscription = stats?.active_subscription;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Subscription Details</h3>
      
      {subscription ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Current Plan</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Plan Name</label>
                  <p className="text-lg font-semibold text-gray-900">{subscription.plan_name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    subscription.is_active 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {subscription.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Renewal Count</label>
                  <p className="text-sm text-gray-900">{subscription.renewal_count}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Validity Period</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="text-sm text-gray-900">
                    {new Date(subscription.start_date).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">End Date</label>
                  <p className="text-sm text-gray-900">
                    {subscription.end_date 
                      ? new Date(subscription.end_date).toLocaleDateString()
                      : 'No end date'
                    }
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Days Remaining</label>
                  <p className="text-sm text-gray-900">
                    {subscription.end_date 
                      ? Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : 'Lifetime'
                    } days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">No active subscription found</p>
        </div>
      )}
    </div>
  );
}

// Payments Tab Component
function PaymentsTab({ stats, loading }: { stats: SellerStats | null; loading: boolean }) {
  if (loading) {
    return <div className="text-center py-4">Loading payment data...</div>;
  }

  const payments = stats?.payment_history || [];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
      
      {payments.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.payment_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${payment.amount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {payment.description || 'Subscription Payment'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : payment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">No payment history found</p>
        </div>
      )}
    </div>
  );
}

// Performance Tab Component
function PerformanceTab({ stats, loading }: { stats: SellerStats | null; loading: boolean }) {
  if (loading) {
    return <div className="text-center py-4">Loading performance data...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats?.total_part_requests || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Requests</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-green-600">{stats?.total_quotes_sent || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Quotes Sent</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats?.accepted_quotes || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Accepted Quotes</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-orange-600">${stats?.total_revenue || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Revenue</div>
        </div>
      </div>

      {/* Additional Performance Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Conversion Rate</h4>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Quote Acceptance Rate</span>
            <span className="font-medium text-gray-900">
              {stats && stats.total_quotes_sent > 0 
                ? `${((stats.accepted_quotes / stats.total_quotes_sent) * 100).toFixed(1)}%`
                : '0%'
              }
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ 
                width: stats && stats.total_quotes_sent > 0 
                  ? `${(stats.accepted_quotes / stats.total_quotes_sent) * 100}%`
                  : '0%'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}