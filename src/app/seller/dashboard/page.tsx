'use client';

import { useState } from 'react';

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = {
    totalListings: 24,
    activeListings: 18,
    totalSales: 156,
    revenue: 12453.67,
    rating: 4.8,
    reviews: 89
  };

  const recentOrders = [
    { id: 'ORD-001', customer: 'John Doe', part: 'Brake Pads', amount: 89.99, status: 'Shipped' },
    { id: 'ORD-002', customer: 'Jane Smith', part: 'Air Filter', amount: 34.99, status: 'Processing' },
    { id: 'ORD-003', customer: 'Mike Johnson', part: 'Alternator', amount: 189.99, status: 'Delivered' },
  ];

  const inventory = [
    { id: 1, name: 'Brake Pads - Ceramic', stock: 15, price: 89.99, status: 'In Stock' },
    { id: 2, name: 'Oil Filter - Premium', stock: 3, price: 12.99, status: 'Low Stock' },
    { id: 3, name: 'Air Filter - Performance', stock: 0, price: 34.99, status: 'Out of Stock' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Seller Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm mb-2">Active Listings</div>
            <div className="text-3xl font-bold">{stats.activeListings}</div>
            <div className="text-sm text-gray-500">of {stats.totalListings} total</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm mb-2">Total Sales</div>
            <div className="text-3xl font-bold">{stats.totalSales}</div>
            <div className="text-sm text-green-600">+12% this month</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm mb-2">Revenue</div>
            <div className="text-3xl font-bold">${stats.revenue.toFixed(2)}</div>
            <div className="text-sm text-green-600">+18% this month</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm mb-2">Rating</div>
            <div className="text-3xl font-bold">⭐ {stats.rating}</div>
            <div className="text-sm text-gray-500">{stats.reviews} reviews</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'inventory'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Inventory
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'analytics'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Order ID</th>
                        <th className="text-left py-2">Customer</th>
                        <th className="text-left py-2">Part</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(order => (
                        <tr key={order.id} className="border-b">
                          <td className="py-3">{order.id}</td>
                          <td className="py-3">{order.customer}</td>
                          <td className="py-3">{order.part}</td>
                          <td className="py-3">${order.amount}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-sm ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
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

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Inventory Management</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Add New Part
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Part Name</th>
                        <th className="text-left py-2">Stock</th>
                        <th className="text-left py-2">Price</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(item => (
                        <tr key={item.id} className="border-b">
                          <td className="py-3">{item.name}</td>
                          <td className="py-3">{item.stock}</td>
                          <td className="py-3">${item.price}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-sm ${
                              item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                              item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <button className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                            <button className="text-red-600 hover:text-red-800">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Order Management</h2>
                <p className="text-gray-600">Manage and track all your orders in one place.</p>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Sales Analytics</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-medium mb-3">Top Selling Parts</h3>
                    <ul className="space-y-2">
                      <li>1. Brake Pads - 45 units</li>
                      <li>2. Oil Filters - 38 units</li>
                      <li>3. Air Filters - 29 units</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-medium mb-3">Monthly Performance</h3>
                    <ul className="space-y-2">
                      <li>Sales: +18% vs last month</li>
                      <li>Orders: +12% vs last month</li>
                      <li>Revenue: +22% vs last month</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
