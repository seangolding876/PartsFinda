// components/admin/PaymentDashboard.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface DashboardStats {
  total_revenue: number;
  today_revenue: number;
  monthly_revenue: number;
  total_users: number;
  active_subscribers: number;
  pending_payments: number;
  expiring_soon: number;
}

interface RevenueData {
  period: string;
  revenue: number;
  transaction_count: number;
  unique_customers: number;
}

interface SubscriptionPlan {
  plan_name: string;
  price: number;
  total_subscriptions: number;
  active_subscriptions: number;
  total_revenue: number;
}

interface ExpiringSubscription {
  id: number;
  name: string;
  email: string;
  business_name: string;
  plan_name: string;
  end_date: string;
  days_remaining: number;
}

export default function PaymentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [expiring, setExpiring] = useState<ExpiringSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const router = useRouter(); // ✅ initialize router here

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, revenueRes, plansRes, expiringRes] = await Promise.all([
        fetch('/api/admin/payments/dashboard'),
        fetch(`/api/admin/payments/revenue?period=${period}`),
        fetch('/api/admin/payments/subscriptions'),
        fetch('/api/admin/payments/expiring')
      ]);

      const statsData = await statsRes.json();
      const revenueData = await revenueRes.json();
      const plansData = await plansRes.json();
      const expiringData = await expiringRes.json();

      if (statsData.success) setStats(statsData.data);
      if (revenueData.success) setRevenueData(revenueData.data);
      if (plansData.success) setPlans(plansData.data);
      if (expiringData.success) setExpiring(expiringData.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple bar chart component
  const SimpleBarChart = ({ data }: { data: RevenueData[] }) => {
    const maxRevenue = Math.max(...data.map(d => d.revenue));
    
    return (
      <div className="w-full h-64 flex items-end space-x-2 pt-4">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer"
              style={{ 
                height: `${(item.revenue / maxRevenue) * 80}%`,
                minHeight: '20px'
              }}
              title={`$${item.revenue} - ${item.period}`}
            />
            <div className="text-xs text-gray-500 mt-2 text-center">
              {period === 'daily' ? item.period.split('-')[2] : 
               period === 'monthly' ? item.period.split('-')[1] : 
               item.period}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Simple pie chart component
  const SimplePieChart = ({ data }: { data: SubscriptionPlan[] }) => {
    const total = data.reduce((sum, plan) => sum + plan.total_revenue, 0);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    let currentAngle = 0;
    
    return (
      <div className="relative w-64 h-64 mx-auto">
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          {data.map((plan, index) => {
            const percentage = (plan.total_revenue / total) * 100;
            const angle = (percentage / 100) * 360;
            const largeArcFlag = percentage > 50 ? 1 : 0;
            
            const x1 = 50 + 40 * Math.cos(currentAngle * Math.PI / 180);
            const y1 = 50 + 40 * Math.sin(currentAngle * Math.PI / 180);
            const x2 = 50 + 40 * Math.cos((currentAngle + angle) * Math.PI / 180);
            const y2 = 50 + 40 * Math.sin((currentAngle + angle) * Math.PI / 180);
            
            const path = `M50,50 L${x1},${y1} A40,40 0 ${largeArcFlag},1 ${x2},${y2} Z`;
            
            const segment = (
              <path
                key={plan.plan_name}
                d={path}
                fill={colors[index % colors.length]}
                stroke="#fff"
                strokeWidth="1"
              />
            );
            
            currentAngle += angle;
            return segment;
          })}
        </svg>
        
        {/* Legend */}
        <div className="absolute -right-32 top-0 space-y-2">
          {data.map((plan, index) => (
            <div key={plan.plan_name} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-gray-700">
                {plan.plan_name} (${plan.total_revenue})
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold text-gray-900">Payment Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg capitalize text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold mt-2">${stats?.total_revenue.toLocaleString() || '0'}</p>
              <p className="text-blue-100 text-xs mt-1">All time revenue</p>
            </div>
            <div className="bg-blue-400 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm font-medium">Today's Revenue</p>
              <p className="text-2xl font-bold mt-2">${stats?.today_revenue.toLocaleString() || '0'}</p>
              <p className="text-green-100 text-xs mt-1">Revenue today</p>
            </div>
            <div className="bg-green-400 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-md text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Subscribers</p>
              <p className="text-2xl font-bold mt-2">{stats?.active_subscribers.toString() || '0'}</p>
              <p className="text-purple-100 text-xs mt-1">Currently active</p>
            </div>
            <div className="bg-purple-400 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-md text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-100 text-sm font-medium">Expiring Soon</p>
              <p className="text-2xl font-bold mt-2">{stats?.expiring_soon.toString() || '0'}</p>
              <p className="text-orange-100 text-xs mt-1">In next 7 days</p>
            </div>
            <div className="bg-orange-400 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

<div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
  <div className="flex justify-between items-center">
    <h3 className="text-lg font-semibold text-gray-900">Payment Management</h3>
    <button
      onClick={() => router.push('/admin/payments/list')}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span>View All Payments & Receipts</span>
    </button>
  </div>
  <p className="text-gray-600 mt-2">View detailed payment history, generate receipts, and manage subscriptions</p>
</div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend ({period})</h3>
          </div>
          <div className="p-6">
            <SimpleBarChart data={revenueData} />
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  ${revenueData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {revenueData.reduce((sum, item) => sum + item.transaction_count, 0)}
                </p>
                <p className="text-sm text-gray-500">Transactions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {revenueData.reduce((sum, item) => sum + item.unique_customers, 0)}
                </p>
                <p className="text-sm text-gray-500">Customers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Distribution */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Subscription Plans Performance</h3>
          </div>
          <div className="p-6">
            <SimplePieChart data={plans} />
            <div className="mt-4 space-y-2">
              {plans.map((plan) => (
                <div key={plan.plan_name} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">{plan.plan_name}</span>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-blue-600">${plan.price}</span>
                    <span className="text-green-600">{plan.active_subscriptions} active</span>
                    <span className="font-bold">${plan.total_revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Subscriptions Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="text-orange-600 mr-2">⚠️</span>
            Subscriptions Expiring Soon (Next 7 Days)
          </h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expiring.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sub.business_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">{sub.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sub.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {sub.plan_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        sub.days_remaining <= 3 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {sub.days_remaining} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sub.end_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expiring.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No subscriptions expiring in the next 7 days
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plans Performance Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Subscription Plans Performance</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Subs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Subs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map((plan) => (
                  <tr key={plan.plan_name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {plan.plan_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${plan.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.total_subscriptions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {plan.active_subscriptions}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${plan.total_revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}