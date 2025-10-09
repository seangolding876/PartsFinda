'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestLoginPage() {
  const router = useRouter();
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  // All available login credentials
  const testCredentials = [
    {
      category: 'Admin Accounts',
      accounts: [
        { email: 'admin@partsfinda.com', password: 'admin123', role: 'admin', description: 'Main Admin Dashboard' },
        { email: 'support@partsfinda.com', password: 'support123', role: 'admin', description: 'Support Team Admin' }
      ]
    },
    {
      category: 'Demo Accounts',
      accounts: [
        { email: 'customer@partsfinda.com', password: 'customer123', role: 'buyer', description: 'Demo Customer/Buyer' },
        { email: 'supplier@partsfinda.com', password: 'supplier123', role: 'seller', description: 'Demo Supplier/Seller' },
        { email: 'buyer@test.com', password: 'password123', role: 'buyer', description: 'Test Buyer Account' },
        { email: 'seller@test.com', password: 'password123', role: 'seller', description: 'Test Seller Account' }
      ]
    }
  ];

  const testLogin = async (email: string, password: string, description: string) => {
    setLoading(true);
    setTestResult(`🔐 Testing login for: ${description} (${email})\n\nStarting authentication...`);

    try {
      console.log('Testing login:', email);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password
        })
      });

      const result = await response.json();

      setTestResult(prev => prev + `\n\n📊 Response Status: ${response.status}\n\n📋 API Response:\n${JSON.stringify(result, null, 2)}`);

      if (result.success) {
        // Test cookie access
        setTimeout(() => {
          const authToken = getCookie('auth-token');
          const userRole = getCookie('user-role');
          const userName = getCookie('user-name');
          const userEmail = getCookie('user-email');

          setTestResult(prev => prev + `\n\n🍪 Cookies Set:\n- Auth Token: ${authToken ? 'SET' : 'NOT SET'}\n- User Role: ${userRole}\n- User Name: ${userName}\n- User Email: ${userEmail}`);

          if (result.user?.role) {
            const dashboardUrl = result.user.role === 'admin' ? '/admin/dashboard' :
                                result.user.role === 'seller' ? '/seller/dashboard' : '/my-requests';

            setTestResult(prev => prev + `\n\n✅ LOGIN SUCCESS!\n🎯 Redirecting to: ${dashboardUrl}`);

            // Redirect after showing success
            setTimeout(() => {
              router.push(dashboardUrl);
            }, 2000);
          }
        }, 1000);
      } else {
        setTestResult(prev => prev + `\n\n❌ LOGIN FAILED: ${result.error}`);
      }

    } catch (error) {
      setTestResult(prev => prev + `\n\n💥 Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getCookie = (name: string): string => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || '';
    }
    return '';
  };

  const testAnyEmailLogin = async () => {
    const email = prompt('Enter any email address:');
    const password = prompt('Enter password (minimum 6 characters):');

    if (email && password) {
      await testLogin(email, password, 'Custom Email Test');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🔐 PartsFinda Login Test Center</h1>
          <p className="text-gray-600">Test all user roles and authentication functionality</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Test Credentials */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">🎯 Available Test Accounts</h2>

            {testCredentials.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-6">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">{category.category}</h3>
                <div className="space-y-3">
                  {category.accounts.map((account, accountIndex) => (
                    <div key={accountIndex} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">{account.description}</p>
                          <p className="text-sm text-gray-600">Email: <code className="bg-gray-100 px-1 rounded">{account.email}</code></p>
                          <p className="text-sm text-gray-600">Password: <code className="bg-gray-100 px-1 rounded">{account.password}</code></p>
                          <p className="text-sm text-blue-600 font-medium">Role: {account.role}</p>
                        </div>
                        <button
                          onClick={() => testLogin(account.email, account.password, account.description)}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:bg-gray-400 text-sm"
                        >
                          {loading ? 'Testing...' : 'Test Login'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom Email Test */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-green-600 mb-3">🆕 Create New Account</h3>
              <p className="text-sm text-gray-600 mb-4">Test with any email - new accounts are created automatically!</p>
              <button
                onClick={testAnyEmailLogin}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400"
              >
                Test Any Email
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">📊 Test Results</h2>

            <div className="bg-gray-900 rounded-lg p-4 min-h-96 max-h-96 overflow-auto">
              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                {testResult || '👆 Click any "Test Login" button above to start testing\n\n🎯 What this tests:\n- API authentication\n- Cookie setting\n- Role-based redirects\n- Error handling\n\n✅ All accounts should work perfectly!'}
              </pre>
            </div>

            {loading && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Testing authentication...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">🧭 Quick Navigation</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <a href="/auth/login" className="bg-white hover:bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-center font-medium text-blue-700 transition-colors">
              Login Page
            </a>
            <a href="/admin/dashboard" className="bg-white hover:bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-center font-medium text-blue-700 transition-colors">
              Admin Dashboard
            </a>
            <a href="/seller/dashboard" className="bg-white hover:bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-center font-medium text-blue-700 transition-colors">
              Seller Dashboard
            </a>
            <a href="/auth/seller-signup" className="bg-white hover:bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-center font-medium text-blue-700 transition-colors">
              Supplier Signup
            </a>
          </div>
        </div>

        {/* File Upload Test */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">📁 File Upload Test</h3>
          <p className="text-green-700 mb-4">To test file uploads in supplier signup:</p>
          <ol className="list-decimal list-inside space-y-2 text-green-700">
            <li>Login as a seller/supplier account above</li>
            <li>Go to Supplier Signup page</li>
            <li>Navigate to Step 5 (Documents)</li>
            <li>Click the upload areas to select files</li>
            <li>Supported formats: PDF, JPG, PNG (up to 5MB)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
