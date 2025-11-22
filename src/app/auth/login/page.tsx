'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/useToast'; 

export default function LoginPage() {
  const router = useRouter();
  const { successmsg, errormsg, infomsg } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Password length validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // console.log('🔐 Attempting login...', { email: formData.email });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();
     // console.log('📊 Login result:', result);

      if (!response.ok) {
        // Server se specific error message mil raha hai
        if (result.error) {
          throw new Error(result.error);
        }
        throw new Error(`HTTP ${response.status}`);
      }

      if (result.success) {
       // console.log('✅ Login successful, saving to localStorage...');

        // ✅ Auth data localStorage mein save karein
        const authData = {
          token: result.authToken,
          role: result.user.role,
          name: result.user.name,
          email: result.user.email,
          userId: result.user.id,
          email_verified: result.user.email_verified,
          verified_status: result.user.verified_status
        };

        localStorage.setItem('authData', JSON.stringify(authData));
       // console.log('💾 Auth data saved to localStorage:', authData);

        // Success message based on role
        const welcomeMessage = result.user.role === 'seller' 
          ? `Welcome back, ${result.user.name}! Ready to manage your parts listings?`
          : result.user.role === 'admin'
          ? `Welcome back, Admin ${result.user.name}!`
          : `Welcome back to PartsFinda, ${result.user.name}!`;

        // Show success toast
        successmsg(welcomeMessage);

        // Redirect based on role
        const redirectTo = result.user.role === 'seller' ? '/seller/dashboard' :
                         result.user.role === 'admin' ? '/admin/dashboard' : '/my-requests';

        //console.log('🔄 Redirecting to:', redirectTo);

        // Small delay for toast to show
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 1000);

      } else {
        // API success: false case
        setError(result.error || 'Login failed. Please try again.');
      }

    } catch (err: any) {
      console.error('❌ Login error:', err);
      
      // ✅ UPDATED ERROR HANDLING - New API responses ke according
      if (err.message.includes('Network') || err.message.includes('fetch')) {
        setError('🌐 Network error: Please check your internet connection and try again.');
      } 
      else if (err.message.includes('Invalid email or password')) {
        setError('❌ Invalid email or password. Please check your credentials and try again.');
      }
      else if (err.message.includes('Email and password are required')) {
        setError('📝 Please enter both email and password.');
      }
      else if (err.message.includes('Invalid email format')) {
        setError('📧 Please enter a valid email address (e.g., user@example.com).');
      }
      else if (err.message.includes('Password must be at least 6 characters')) {
        setError('🔒 Password must be at least 6 characters long.');
      }
      
      // ✅ NEW: Seller specific errors
      else if (err.message.includes('Please verify your email first')) {
        setError('📨 Please verify your email address before logging in. Check your inbox for verification link.');
      }
      else if (err.message.includes('Your account is under review')) {
        setError('⏳ Your seller account is under review. You will receive an approval email within 1-2 business days. Thank you for your patience!');
      }
      
      // ✅ NEW: Buyer specific errors
      else if (err.message.includes('verify your email first')) {
        setError('📧 Please verify your email address to continue. Check your inbox for verification link.');
      }
      
      // ✅ HTTP Status based errors
      else if (err.message.includes('HTTP 401')) {
        setError('❌ Invalid email or password. Please try again.');
      }
      else if (err.message.includes('HTTP 403')) {
        setError('🚫 Access denied. Please complete the verification process or contact support.');
      }
      else if (err.message.includes('HTTP 500')) {
        setError('⚡ Server error: Please try again in a few moments.');
      }
      else if (err.message.includes('HTTP 400')) {
        setError('❌ Invalid request. Please check your input and try again.');
      }
      else if (err.message.includes('Invalid user role')) {
        setError('🔐 Account configuration error. Please contact support.');
      }
      else {
        setError('❌ Unable to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleDemoLogin = (role: 'buyer' | 'seller' | 'admin') => {
    const demoAccounts = {
      buyer: { email: 'buyer@demo.com', password: 'demo123' },
      seller: { email: 'seller@demo.com', password: 'demo123' },
      admin: { email: 'admin@demo.com', password: 'demo123' }
    };
    
    setFormData(demoAccounts[role]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="text-center mb-6">
            <Link href="/" className="flex items-center justify-center gap-2 mb-4">
              <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xl">
                Parts
              </div>
              <div className="text-blue-600 font-bold text-xl">
                Finda
              </div>
            </Link>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        {/* Info Box */}
        {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Account Verification Info</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Buyers:</strong> Email verification required</li>
            <li>• <strong>Sellers:</strong> Email + Management approval required</li>
            <li>• <strong>Admins:</strong> Direct access</li>
          </ul>
        </div> */}

      {/* Info Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-green-800 mb-2">New to PartsFinda?</h3>
          <p className="text-sm text-green-700 mb-2">
            Create an account to start <strong>buying</strong> or <strong>selling</strong> auto parts in Jamaica.
          </p>
          <p className="text-sm text-green-700">
            For suppliers: Apply as a <strong>verified seller</strong> to list your products and reach buyers faster.
          </p>
        </div>


        {/* Demo Accounts (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">Demo Accounts (Development)</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleDemoLogin('buyer')}
                className="flex-1 bg-yellow-100 text-yellow-700 px-3 py-2 rounded text-sm hover:bg-yellow-200 transition-colors"
              >
                Buyer Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('seller')}
                className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded text-sm hover:bg-green-200 transition-colors"
              >
                Seller Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200 transition-colors"
              >
                Admin Demo
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="Enter your email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Seller Registration Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Want to sell auto parts?{' '}
              <Link href="/auth/seller-register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Register as a seller
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}