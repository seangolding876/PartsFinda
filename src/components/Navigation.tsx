'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Menu,
  X,
  MessageSquare,
  Settings,
  Users,
  Car,
  Crown,
  Bell,
  BarChart3,
  ClipboardList,
  ChevronDown,
  Star,
  Zap,
  Gem,
  Award,
  CheckCircle,
  User,
  LogOut,
  ShoppingBag,
  Package,
  TrendingUp,
  Shield,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { Dialog } from '@headlessui/react';

export default function Navigation() {
  const { user, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [membershipPlan, setMembershipPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Fetch seller's current membership plan from API
  useEffect(() => {
    if (user?.role === 'seller') {
      fetchMembershipPlan();
    }
  }, [user]);

  const fetchMembershipPlan = async () => {
    try {
      setPlanLoading(true);
      
      // Get token from auth context
      const authData = JSON.parse(localStorage.getItem('authData') || '{}');
      const token = authData.token;
      
      if (!token) {
        console.log('No token found');
        return;
      }

      const response = await fetch('/api/seller/membership-plan', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMembershipPlan(data.plan);
      } else {
        console.error('Failed to fetch membership plan:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch membership plan:', error);
    } finally {
      setPlanLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    setProfileOpen(false);
  };

  const handleUpgradeToPro = () => {
    window.open('/seller/subscription', '_blank');
    setMobileMenuOpen(false);
    setProfileOpen(false);
  };

  // Get plan icon and color
  const getPlanDetails = (planName) => {
    const plans = {
      'Basic': { 
        icon: Star, 
        color: 'text-gray-600', 
        bgColor: 'bg-gray-100', 
        borderColor: 'border-gray-300',
        gradient: 'from-gray-100 to-gray-200',
        badgeColor: 'bg-gray-500'
      },
      'Enterprise': { 
        icon: Zap, 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-50', 
        borderColor: 'border-blue-300',
        gradient: 'from-blue-50 to-blue-100',
        badgeColor: 'bg-blue-500'
      },
      'Premium': { 
        icon: Crown, 
        color: 'text-purple-600', 
        bgColor: 'bg-purple-50', 
        borderColor: 'border-purple-300',
        gradient: 'from-purple-50 to-purple-100',
        badgeColor: 'bg-purple-500'
      }
    };
    
    return plans[planName] || plans['Basic'];
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Lifetime';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if plan is expired
  const isPlanExpired = (plan) => {
    if (!plan || !plan.end_date) return false;
    try {
      return new Date(plan.end_date) < new Date();
    } catch (error) {
      return false;
    }
  };

  return (
    
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">

            {/* 🌟 Slim Upgrade Banner */}
      {user?.role === 'seller' && (
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-medium flex items-center justify-center py-1.5 shadow-sm">
          <span className="flex items-center gap-1">
            <Crown className="w-3 h-3" />
            {membershipPlan?.plan_name === 'Basic' || !membershipPlan
              ? 'Upgrade to Pro for more features!'
              : isPlanExpired(membershipPlan)
              ? 'Your plan expired — renew now!'
              : 'Enjoy your Pro membership!'}
          </span>

          {(membershipPlan?.plan_name === 'Basic' || isPlanExpired(membershipPlan)) && (
            <button
              onClick={handleUpgradeToPro}
              className="ml-3 px-2 py-0.5 rounded-full bg-white text-yellow-700 font-semibold hover:bg-yellow-50 transition-all text-[11px]"
            >
              Upgrade
            </button>
          )}
        </div>
      )}
      {/* 🎯 SELLER MEMBERSHIP PLAN BANNER - Professional Header */}
{user?.role === 'seller' && (
  <div className={`bg-gradient-to-r ${membershipPlan ? getPlanDetails(membershipPlan.plan_name).gradient : 'from-gray-100 to-gray-200'} border-b ${membershipPlan ? getPlanDetails(membershipPlan.plan_name).borderColor : 'border-gray-300'}`}>
    <div className="container mx-auto px-3 py-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {planLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <>
              <div className={`p-1.5 rounded-md ${getPlanDetails(membershipPlan?.plan_name || 'Basic').bgColor}`}>
                {(() => {
                  const IconComponent = getPlanDetails(membershipPlan?.plan_name || 'Basic').icon;
                  return <IconComponent className={`w-4 h-4 ${getPlanDetails(membershipPlan?.plan_name || 'Basic').color}`} />;
                })()}
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${getPlanDetails(membershipPlan?.plan_name || 'Basic').badgeColor} text-white`}>
                  {membershipPlan?.plan_name || 'Basic'}
                </span>
                
                {membershipPlan?.end_date ? (
                  <span className={`text-xs ${isPlanExpired(membershipPlan) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                    {isPlanExpired(membershipPlan) ? '⚠️ ' : ''}
                    {formatDate(membershipPlan.end_date)}
                  </span>
                ) : (
                  <span className="text-xs text-green-600">✅ Active</span>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {(membershipPlan?.plan_name === 'Basic' || isPlanExpired(membershipPlan)) && (
            <button
              onClick={handleUpgradeToPro}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 shadow-sm hover:shadow"
            >
              <Crown className="w-3 h-3" />
              {isPlanExpired(membershipPlan) ? 'Renew' : 'Upgrade'}
            </button>
          )}
          
          {membershipPlan && !isPlanExpired(membershipPlan) && membershipPlan.plan_name !== 'Basic' && (
            <div className="text-right">
              <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Active
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}

      {/* Main Navigation Bar */}
      <div className="container mx-auto px-2 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-4 py-2 rounded-xl font-bold text-xl shadow-lg">
              PartsFinda
            </div>
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-black px-3 py-1 rounded-lg text-sm font-semibold shadow-md">
              Jamaica
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm uppercase tracking-wide"
            >
              Home
            </Link>
            
            {/* Request Part - Condition */}
            {(!user || user?.role === 'buyer') && (
              <Link 
                href="/request-part" 
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm uppercase tracking-wide"
              >
                Request Part
              </Link>
            )}
            
            {/* <Link 
              href="/parts" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm uppercase tracking-wide"
            >
              Browse Parts
            </Link> */}

            <Link 
              href="/contact" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm uppercase tracking-wide"
            >
              Contact
            </Link>

            {user && (
              <>
                {/* Common for all users */}
                <Link
                  href="/messages"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>

                {/* Buyer Specific */}
                {user.role === 'buyer' && (
                  <Link 
                    href="/my-requests" 
                    className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
                  >
                    My Requests
                  </Link>
                )}

                {/* Seller Specific */}
                {user.role === 'seller' && (
                  <>
                    <Link 
                      href="/seller/dashboard" 
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Dashboard
                    </Link>
                    {/* <Link 
                      href="/seller/parts" 
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
                    >
                      <Package className="w-4 h-4" />
                      My Parts
                    </Link> */}
                    {/* <Link 
                      href="/seller/orders" 
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Orders
                    </Link> */}
                  </>
                )}

                {/* Admin Dropdown */}
                {user.role === 'admin' && (
                  <div className="relative">
                    <button
                      onClick={() => setAdminOpen(!adminOpen)}
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Panel
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${adminOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {adminOpen && (
                      <div className="absolute left-0 mt-3 w-64 bg-white border border-gray-200 shadow-2xl rounded-2xl py-3 animate-fadeIn z-50">
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-sm font-medium text-gray-700 transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 text-blue-600" />
                          Analytics Dashboard
                        </Link>
                        <Link
                          href="/admin/users"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-sm font-medium text-gray-700 transition-colors"
                        >
                          <Users className="w-4 h-4 text-green-600" />
                          Manage Users
                        </Link>
                        {/* <Link
                          href="/admin/parts"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-sm font-medium text-gray-700 transition-colors"
                        >
                          <Package className="w-4 h-4 text-purple-600" />
                          Manage Parts
                        </Link> */}
                        <Link
                          href="/admin/payments"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-sm font-medium text-gray-700 transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4 text-orange-600" />
                          Payments
                        </Link>
                        <Link
                          href="/admin/settings"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-sm font-medium text-gray-700 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-gray-600" />
                          System Settings
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Side (Desktop) */}
          <div className="hidden lg:flex items-center gap-6">
            {isLoading ? (
              <div className="flex items-center gap-4">
                <div className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            ) : user ? (
              <div className="flex items-center gap-6">
                {/* Notifications */}
                <div className="flex items-center gap-4">
                  <NotificationBell />
                </div>

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors duration-200 border border-gray-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-600 capitalize">{user.role}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-2xl rounded-2xl py-3 animate-fadeIn z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                        <p className="text-xs text-blue-600 font-medium capitalize mt-1">{user.role}</p>
                      </div>
                      
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-sm font-medium text-gray-700 transition-colors"
                      >
                        <User className="w-4 h-4 text-blue-600" />
                        My Profile
                      </Link>
                      
                      {user.role === 'seller' && (
                        <Link
                          href="/seller/subscription"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-sm font-medium text-gray-700 transition-colors"
                        >
                          <Crown className="w-4 h-4 text-yellow-600" />
                          Subscription Plans
                        </Link>
                      )}
                      
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-sm font-medium text-red-600 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                >
                  Login
                </Link>
                <div className="flex gap-3">
                  <Link
                    href="/auth/register"
                    className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 px-6 py-2 rounded-xl font-semibold transition-all duration-200"
                  >
                    Join as Buyer
                  </Link>
                  <Link
                    href="/auth/seller-register"
                    className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Become Supplier
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* 📱 Mobile Drawer Menu - Professional */}
      <Dialog
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <Dialog.Panel className="fixed inset-y-0 right-0 w-96 max-w-full bg-white p-6 overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-3 py-2 rounded-lg font-bold text-lg">
                PF
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">PartsFinda</h2>
                <p className="text-xs text-gray-600">Jamaica</p>
              </div>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Mobile User Info */}
          {user && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-blue-600 font-medium capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Navigation Links */}
          <div className="space-y-2">
            <Link 
              href="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-4 hover:bg-blue-50 rounded-xl transition-colors text-gray-700 font-medium"
            >
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
              Home
            </Link>

            {/* Request Part - Mobile */}
            {(!user || user?.role === 'buyer') && (
              <Link 
                href="/request-part" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-4 hover:bg-blue-50 rounded-xl transition-colors text-gray-700 font-medium"
              >
                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                Request Part
              </Link>
            )}

            {/* <Link 
              href="/parts" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-4 hover:bg-blue-50 rounded-xl transition-colors text-gray-700 font-medium"
            >
              <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              </div>
              Browse Parts
            </Link> */}

            {user && (
              <>
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-4 hover:bg-blue-50 rounded-xl transition-colors text-gray-700 font-medium"
                >
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  Messages
                </Link>

                {/* Buyer Mobile Links */}
                {user.role === 'buyer' && (
                  <Link
                    href="/my-requests"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-4 hover:bg-blue-50 rounded-xl transition-colors text-gray-700 font-medium"
                  >
                    <Package className="w-6 h-6 text-orange-600" />
                    My Requests
                  </Link>
                )}

                {/* Seller Mobile Links */}
                {user.role === 'seller' && (
                  <>
                    <Link
                      href="/seller/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-4 hover:bg-blue-50 rounded-xl transition-colors text-gray-700 font-medium"
                    >
                      <BarChart3 className="w-6 h-6 text-green-600" />
                      Seller Dashboard
                    </Link>
                    {/* <Link
                      href="/seller/parts"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-4 hover:bg-blue-50 rounded-xl transition-colors text-gray-700 font-medium"
                    >
                      <Package className="w-6 h-6 text-purple-600" />
                      My Parts
                    </Link> */}
                    <Link
                      href="/seller/subscription"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-4 hover:bg-blue-50 rounded-xl transition-colors text-gray-700 font-medium"
                    >
                      <Crown className="w-6 h-6 text-yellow-600" />
                      Subscription Plans
                    </Link>
                  </>
                )}

                {/* Admin Mobile Links */}
                {user.role === 'admin' && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 mb-2">Admin Panel</p>
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-4 hover:bg-blue-50 rounded-xl transition-colors text-gray-700 font-medium"
                    >
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                      Dashboard
                    </Link>
                    <Link
                      href="/admin/users"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-4 hover:bg-blue-50 rounded-xl transition-colors text-gray-700 font-medium"
                    >
                      <Users className="w-6 h-6 text-green-600" />
                      Manage Users
                    </Link>
                  </div>
                )}
              </>
            )}

            <Link 
              href="/contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-4 hover:bg-blue-50 rounded-xl transition-colors text-gray-700 font-medium"
            >
              <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              </div>
              Contact Us
            </Link>
          </div>

          {/* Mobile Auth Buttons */}
          {!user && (
            <div className="mt-8 space-y-3">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors"
              >
                Login to Account
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center border-2 border-gray-300 hover:border-blue-500 text-gray-700 py-3 px-4 rounded-xl font-semibold transition-colors"
                >
                  Join as Buyer
                </Link>
                <Link
                  href="/auth/seller-register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors"
                >
                  Become Supplier
                </Link>
              </div>
            </div>
          )}

          {/* Mobile Logout */}
          {user && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full p-4 hover:bg-red-50 rounded-xl transition-colors text-red-600 font-semibold"
              >
                <LogOut className="w-6 h-6" />
                Sign Out
              </button>
            </div>
          )}
        </Dialog.Panel>
      </Dialog>
    </nav>
  );
}