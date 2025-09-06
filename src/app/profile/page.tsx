'use client';

import { useState } from 'react';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('account');

  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'Los Angeles, CA',
    memberSince: 'August 2024',
    verified: true,
    rating: 4.8,
    transactions: 45,
    role: 'Buyer & Seller'
  };

  const vehicles = [
    { id: 1, year: 2020, make: 'Toyota', model: 'Camry', vin: 'JT2BG12K...' },
    { id: 2, year: 2018, make: 'Honda', model: 'Accord', vin: 'HN4CG56P...' }
  ];

  const recentOrders = [
    { id: 'ORD-789', date: '2024-12-28', item: 'Brake Pads', status: 'Delivered', amount: 89.99 },
    { id: 'ORD-788', date: '2024-12-25', item: 'Air Filter', status: 'Shipped', amount: 34.99 },
    { id: 'ORD-787', date: '2024-12-20', item: 'Oil Filter', status: 'Delivered', amount: 12.99 }
  ];

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
                {user.verified && (
                  <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded">
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-2">{user.role}</p>
              <div className="grid md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-semibold">{user.memberSince}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-semibold">{user.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="font-semibold">⭐ {user.rating}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transactions</p>
                  <p className="font-semibold">{user.transactions}</p>
                </div>
              </div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('account')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'account'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Account Details
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'vehicles'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Vehicles
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Order History
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 font-medium ${
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
                      value={user.name}
                      className="w-full px-3 py-2 border rounded-lg"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      className="w-full px-3 py-2 border rounded-lg"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={user.phone}
                      className="w-full px-3 py-2 border rounded-lg"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={user.location}
                      className="w-full px-3 py-2 border rounded-lg"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">My Vehicles</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Add Vehicle
                  </button>
                </div>
                <div className="space-y-4">
                  {vehicles.map(vehicle => (
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
                  ))}
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
                      {recentOrders.map(order => (
                        <tr key={order.id} className="border-b">
                          <td className="py-3">{order.id}</td>
                          <td className="py-3">{order.date}</td>
                          <td className="py-3">{order.item}</td>
                          <td className="py-3">${order.amount}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-sm ${
                              order.status === 'Delivered'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
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
