'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  business_name?: string;
  business_phone?: string;
  address?: string;
  parish?: string;
  city?: string;
  website?: string;
  bio?: string;
  profile_completion_percentage: number;
  avatar_url?: string;
  cover_image_url?: string;
  email_verified: boolean;
  verified_status?: string;
  created_at: string;
  avg_rating: number;
  total_ratings: number;
}

interface Vehicle {
  id: number;
  year: number;
  make: string;
  model: string;
  vin: string;
  license_plate?: string;
}

interface Order {
  id: string;
  date: string;
  item: string;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  amount: number;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('account');
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    business_name: '',
    business_phone: '',
    address: '',
    parish: '',
    city: '',
    website: '',
    bio: ''
  });
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
    fetchVehicles();
    fetchRecentOrders();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const authData = localStorage.getItem('authData');
      if (!authData) {
        router.push('/auth/login');
        return;
      }

      const { token } = JSON.parse(authData);
      
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setUser(result.data);
        setFormData({
          name: result.data.name || '',
          phone: result.data.phone || '',
          business_name: result.data.business_name || '',
          business_phone: result.data.business_phone || '',
          address: result.data.address || '',
          parish: result.data.parish || '',
          city: result.data.city || '',
          website: result.data.website || '',
          bio: result.data.bio || ''
        });
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const authData = localStorage.getItem('authData');
      if (!authData) return;

      const { token } = JSON.parse(authData);
      
      // Temporary mock data - aap apni vehicles API banayenge
      const mockVehicles: Vehicle[] = [
        { id: 1, year: 2020, make: 'Toyota', model: 'Camry', vin: 'JT2BG12K7W1234567' },
        { id: 2, year: 2018, make: 'Honda', model: 'Accord', vin: '1HGCG5658WA123456' }
      ];
      setVehicles(mockVehicles);
    } catch (error) {
      console.error('Vehicles fetch error:', error);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const authData = localStorage.getItem('authData');
      if (!authData) return;

      const { token } = JSON.parse(authData);
      
      // Temporary mock data - aap apni orders API banayenge
      const mockOrders: Order[] = [
        { id: 'ORD-789', date: '2024-12-28', item: 'Brake Pads', status: 'delivered', amount: 89.99 },
        { id: 'ORD-788', date: '2024-12-25', item: 'Air Filter', status: 'shipped', amount: 34.99 },
        { id: 'ORD-787', date: '2024-12-20', item: 'Oil Filter', status: 'delivered', amount: 12.99 }
      ];
      setRecentOrders(mockOrders);
    } catch (error) {
      console.error('Orders fetch error:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const authData = localStorage.getItem('authData');
      if (!authData) return;

      const { token } = JSON.parse(authData);
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        setUser(prev => prev ? { ...prev, ...formData, profile_completion_percentage: result.profile_completion } : null);
        setEditing(false);
        alert('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile');
    }
  };

  const handleAddVehicle = () => {
    // Add vehicle logic here
    alert('Add vehicle functionality coming soon!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
          <button 
            onClick={() => router.push('/auth/login')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Login Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-start gap-6">
            <div className="text-6xl">👤</div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                {user.email_verified && (
                  <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded">
                    ✓ Email Verified
                  </span>
                )}
                {user.verified_status === 'verified' && (
                  <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                    ✓ Seller Verified
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-2 capitalize">{user.role}</p>
              <div className="grid md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-semibold">{formatDate(user.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-semibold">
                    {user.city && user.parish ? `${user.city}, ${user.parish}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="font-semibold">⭐ {user.avg_rating || 'No ratings'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profile Complete</p>
                  <p className="font-semibold">{user.profile_completion_percentage}%</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setEditing(!editing)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {editing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('account')}
                className={`px-6 py-3 font-medium whitespace-nowrap ${
                  activeTab === 'account'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Account Details
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`px-6 py-3 font-medium whitespace-nowrap ${
                  activeTab === 'vehicles'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Vehicles
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 font-medium whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Order History
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 font-medium whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Settings
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      readOnly={!editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      readOnly={!editing}
                    />
                  </div>
                  {user.role === 'seller' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.business_phone}
                        onChange={(e) => setFormData({...formData, business_phone: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        readOnly={!editing}
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      readOnly={!editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      readOnly={!editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parish
                    </label>
                    <select
                      value={formData.parish}
                      onChange={(e) => setFormData({...formData, parish: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      disabled={!editing}
                    >
                      <option value="">Select Parish</option>
                      <option value="Kingston">Kingston</option>
                      <option value="St. Andrew">St. Andrew</option>
                      <option value="St. Catherine">St. Catherine</option>
                      <option value="Clarendon">Clarendon</option>
                      <option value="Manchester">Manchester</option>
                      <option value="St. Elizabeth">St. Elizabeth</option>
                      <option value="Westmoreland">Westmoreland</option>
                      <option value="Hanover">Hanover</option>
                      <option value="St. James">St. James</option>
                      <option value="Trelawny">Trelawny</option>
                      <option value="St. Ann">St. Ann</option>
                      <option value="St. Mary">St. Mary</option>
                      <option value="Portland">Portland</option>
                      <option value="St. Thomas">St. Thomas</option>
                    </select>
                  </div>
                  {user.role === 'seller' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={formData.business_name}
                        onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        readOnly={!editing}
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      readOnly={!editing}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg"
                      readOnly={!editing}
                      placeholder="Tell us about yourself or your business..."
                    />
                  </div>
                </div>
                {editing && (
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setEditing(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">My Vehicles</h2>
                  <button 
                    onClick={handleAddVehicle}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    + Add Vehicle
                  </button>
                </div>
                <div className="space-y-4">
                  {vehicles.length > 0 ? vehicles.map(vehicle => (
                    <div key={vehicle.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h3>
                          <p className="text-sm text-gray-600">VIN: {vehicle.vin}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-800">Edit</button>
                          <button className="text-red-600 hover:text-red-800">Remove</button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      No vehicles added yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Order History</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Order ID</th>
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Item</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.length > 0 ? recentOrders.map(order => (
                        <tr key={order.id} className="border-b">
                          <td className="py-3">{order.id}</td>
                          <td className="py-3">{order.date}</td>
                          <td className="py-3">{order.item}</td>
                          <td className="py-3">${order.amount}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-sm ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-gray-500">
                            No orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Notifications</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      Email notifications for new messages
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      Email notifications for order updates
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Marketing emails
                    </label>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Security</h3>
                  <div className="space-y-3">
                    <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">
                      Change Password
                    </button>
                    <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 ml-3">
                      Enable Two-Factor Authentication
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Account</h3>
                  <button className="text-red-600 hover:text-red-800">
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}