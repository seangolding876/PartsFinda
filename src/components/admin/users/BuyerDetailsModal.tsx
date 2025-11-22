'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast'; 

interface BuyerUser {
  id: number;
  email: string;
  name: string;
  role: 'buyer';
  phone: string;
  email_verified: boolean;
  created_at: string;
  avg_rating: number;
  total_ratings: number;
  address?: string;
  parish?: string;
  city?: string;
  postal_code?: string;
  profile_completion_percentage?: number;
  last_login?: string;
}

interface BuyerStats {
  total_part_requests: number;
  open_requests: number;
  fulfilled_requests: number;
  total_quotes_received: number;
  accepted_quotes: number;
  total_spent: number;
}

interface BuyerDetailsModalProps {
  buyer: BuyerUser | null;
  onClose: () => void;
}

export default function BuyerDetailsModal({ buyer, onClose }: BuyerDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'requests' | 'activity'>('profile');
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { successmsg, errormsg, infomsg } = useToast(); 

  useEffect(() => {
    if (buyer) {
      fetchBuyerStats();
    }
  }, [buyer]);

// Client component
const fetchBuyerStats = async () => {
  if (!buyer) return;
  
  setLoading(true);
  try {
    //console.log(`🔄 Fetching stats for buyer ID: ${buyer.id}`);
    
    const response = await fetch(`/api/admin/users/${buyer.id}/stats?role=buyer`);
    
    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error: ${response.status}`, errorText);
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Expected JSON, got:', contentType, text);
      throw new Error(`Server returned non-JSON response: ${contentType}`);
    }

    const data = await response.json();
  //  console.log('✅ API Response:', data);

    if (data.success) {
      setStats(data.data);
    } else {
      console.error('❌ API returned error:', data);
      throw new Error(data.error || 'Unknown API error');
    }
  } catch (error: any) {
    console.error('💥 Error fetching buyer stats:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // You can show a user-friendly error message here
    errormsg('Failed to load buyer stats. Please try again later.');
  } finally {
    setLoading(false);
  }
};

  if (!buyer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{buyer.name}</h2>
              <p className="text-gray-600">{buyer.email}</p>
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
              { id: 'requests', name: 'Part Requests' }
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
          {activeTab === 'profile' && <BuyerProfileTab buyer={buyer} />}
          {activeTab === 'requests' && <BuyerRequestsTab stats={stats} loading={loading} />}
          {/* {activeTab === 'activity' && <BuyerActivityTab buyer={buyer} stats={stats} loading={loading} />} */}
        </div>
      </div>
    </div>
  );
}

// Buyer Profile Tab
function BuyerProfileTab({ buyer }: { buyer: BuyerUser }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-500">Full Name</label>
            <p className="text-sm text-gray-900">{buyer.name}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-sm text-gray-900">{buyer.email}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Phone</label>
            <p className="text-sm text-gray-900">{buyer.phone || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Email Verified</label>
            <p className="text-sm text-gray-900">
              {buyer.email_verified ? 'Yes' : 'No'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Profile Completion</label>
            <div className="flex items-center space-x-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${buyer.profile_completion_percentage || 0}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{buyer.profile_completion_percentage || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-500">Address</label>
            <p className="text-sm text-gray-900">{buyer.address || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Parish</label>
            <p className="text-sm text-gray-900">{buyer.parish || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">City</label>
            <p className="text-sm text-gray-900">{buyer.city || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Postal Code</label>
            <p className="text-sm text-gray-900">{buyer.postal_code || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-500">Member Since</label>
            <p className="text-sm text-gray-900">
              {new Date(buyer.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Last Login</label>
            <p className="text-sm text-gray-900">
              {buyer.last_login 
                ? new Date(buyer.last_login).toLocaleString()
                : 'Never'
              }
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">User Rating</label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-900">{buyer.avg_rating || 0}/5</span>
              <span className="text-sm text-gray-500">({buyer.total_ratings || 0} ratings)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Buyer Requests Tab
function BuyerRequestsTab({ stats, loading }: { stats: BuyerStats | null; loading: boolean }) {
  if (loading) {
    return <div className="text-center py-4">Loading request data...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Part Request Statistics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats?.total_part_requests || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Requests</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats?.open_requests || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Open Requests</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-green-600">{stats?.fulfilled_requests || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Fulfilled Requests</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats?.total_quotes_received || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Quotes Received</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-green-600">{stats?.accepted_quotes || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Accepted Quotes</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-orange-600">${stats?.total_spent || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Spent</div>
        </div>
      </div>

      {/* Request Analytics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Request Analytics</h4>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Fulfillment Rate</span>
              <span className="font-medium text-gray-900">
                {stats && stats.total_part_requests > 0 
                  ? `${((stats.fulfilled_requests / stats.total_part_requests) * 100).toFixed(1)}%`
                  : '0%'
                }
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ 
                  width: stats && stats.total_part_requests > 0 
                    ? `${(stats.fulfilled_requests / stats.total_part_requests) * 100}%`
                    : '0%'
                }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Quote Acceptance Rate</span>
              <span className="font-medium text-gray-900">
                {stats && stats.total_quotes_received > 0 
                  ? `${((stats.accepted_quotes / stats.total_quotes_received) * 100).toFixed(1)}%`
                  : '0%'
                }
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ 
                  width: stats && stats.total_quotes_received > 0 
                    ? `${(stats.accepted_quotes / stats.total_quotes_received) * 100}%`
                    : '0%'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Buyer Activity Tab
function BuyerActivityTab({ buyer, stats, loading }: { buyer: BuyerUser; stats: BuyerStats | null; loading: boolean }) {
  if (loading) {
    return <div className="text-center py-4">Loading activity data...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Activity Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Activity Summary</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Active Requests</span>
              <span className="text-sm font-medium text-gray-900">{stats?.open_requests || 0}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Avg. Quotes per Request</span>
              <span className="text-sm font-medium text-gray-900">
                {stats && stats.total_part_requests > 0 
                  ? (stats.total_quotes_received / stats.total_part_requests).toFixed(1)
                  : 0
                }
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Avg. Spending per Request</span>
              <span className="text-sm font-medium text-gray-900">
                ${stats && stats.total_part_requests > 0 
                  ? (stats.total_spent / stats.total_part_requests).toFixed(2)
                  : 0
                }
              </span>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Account Status</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Account Created</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(buyer.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Last Active</span>
              <span className="text-sm font-medium text-gray-900">
                {buyer.last_login 
                  ? new Date(buyer.last_login).toLocaleDateString()
                  : 'Never'
                }
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Email Verified</span>
              <span className={`text-sm font-medium ${
                buyer.email_verified ? 'text-green-600' : 'text-red-600'
              }`}>
                {buyer.email_verified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Profile Complete</span>
              <span className="text-sm font-medium text-gray-900">
                {buyer.profile_completion_percentage || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Rating & Reviews</h4>
        
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{buyer.avg_rating || 0}</div>
            <div className="text-sm text-gray-500">Average Rating</div>
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Total Ratings</span>
              <span className="font-medium text-gray-900">{buyer.total_ratings || 0}</span>
            </div>
            
            {buyer.avg_rating > 0 && (
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        star <= Math.round(buyer.avg_rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  ({buyer.avg_rating.toFixed(1)} out of 5)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}