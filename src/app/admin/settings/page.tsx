'use client';

import { useState, useEffect } from 'react';

interface SystemSettings {
  general: {
    site_name: string;
    site_description: string;
    admin_email: string;
    timezone: string;
    date_format: string;
    items_per_page: number;
  };
  security: {
    session_timeout: number;
    password_min_length: number;
    max_login_attempts: number;
    enable_2fa: boolean;
    enable_captcha: boolean;
  };
  notifications: {
    email_notifications: boolean;
    sms_notifications: boolean;
    new_user_alerts: boolean;
    payment_alerts: boolean;
    system_alerts: boolean;
  };
  payment: {
    currency: string;
    tax_rate: number;
    payment_methods: string[];
    auto_renewal: boolean;
    invoice_prefix: string;
  };
  appearance: {
    theme: string;
    primary_color: string;
    logo_url: string;
    favicon_url: string;
    language: string;
  };
}

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'payment' | 'appearance'>('general');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings from API
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      
      if (data.success) {
        // Transform flat settings to categorized structure
        const categorizedSettings: SystemSettings = {
          general: {
            site_name: data.data.site_name || 'PartsFinda',
            site_description: data.data.site_description || 'Auto Parts Marketplace',
            admin_email: data.data.admin_email || 'admin@partsfinda.com',
            timezone: data.data.timezone || 'UTC+5',
            date_format: data.data.date_format || 'DD/MM/YYYY',
            items_per_page: data.data.items_per_page || 20
          },
          security: {
            session_timeout: data.data.session_timeout || 60,
            password_min_length: data.data.password_min_length || 6,
            max_login_attempts: data.data.max_login_attempts || 5,
            enable_2fa: data.data.enable_2fa || false,
            enable_captcha: data.data.enable_captcha || true
          },
          notifications: {
            email_notifications: data.data.email_notifications || true,
            sms_notifications: data.data.sms_notifications || false,
            new_user_alerts: data.data.new_user_alerts || true,
            payment_alerts: data.data.payment_alerts || true,
            system_alerts: data.data.system_alerts || true
          },
          payment: {
            currency: data.data.currency || 'USD',
            tax_rate: data.data.tax_rate || 0,
            payment_methods: data.data.payment_methods || ['stripe', 'paypal'],
            auto_renewal: data.data.auto_renewal || true,
            invoice_prefix: data.data.invoice_prefix || 'INV'
          },
          appearance: {
            theme: data.data.theme || 'light',
            primary_color: data.data.primary_color || '#3B82F6',
            logo_url: data.data.logo_url || '/logo.png',
            favicon_url: data.data.favicon_url || '/favicon.ico',
            language: data.data.language || 'en'
          }
        };
        
        setSettings(categorizedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      // Flatten settings for API
      const flatSettings = {
        ...settings.general,
        ...settings.security,
        ...settings.notifications,
        ...settings.payment,
        ...settings.appearance
      };

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: flatSettings }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to default?')) return;
    
    try {
      const response = await fetch('/api/admin/settings/reset', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Settings reset to default!');
        loadSettings();
      } else {
        alert('Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      alert('Error resetting settings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load settings</p>
          <button
            onClick={loadSettings}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-2">Manage your platform configuration and preferences</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'general', name: 'General', icon: '⚙️' },
                { id: 'security', name: 'Security', icon: '🔒' },
                { id: 'notifications', name: 'Notifications', icon: '🔔' },
                { id: 'payment', name: 'Payment', icon: '💳' },
                { id: 'appearance', name: 'Appearance', icon: '🎨' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'general' && (
              <GeneralSettings 
                settings={settings.general} 
                onChange={(data) => setSettings(prev => prev ? { ...prev, general: data } : null)} 
              />
            )}
            {activeTab === 'security' && (
              <SecuritySettings 
                settings={settings.security} 
                onChange={(data) => setSettings(prev => prev ? { ...prev, security: data } : null)} 
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationSettings 
                settings={settings.notifications} 
                onChange={(data) => setSettings(prev => prev ? { ...prev, notifications: data } : null)} 
              />
            )}
            {activeTab === 'payment' && (
              <PaymentSettings 
                settings={settings.payment} 
                onChange={(data) => setSettings(prev => prev ? { ...prev, payment: data } : null)} 
              />
            )}
            {activeTab === 'appearance' && (
              <AppearanceSettings 
                settings={settings.appearance} 
                onChange={(data) => setSettings(prev => prev ? { ...prev, appearance: data } : null)} 
              />
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Reset to Default
            </button>
            <div className="flex space-x-3">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// General Settings Component
function GeneralSettings({ settings, onChange }: { settings: SystemSettings['general'], onChange: (data: SystemSettings['general']) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Site Name *
          </label>
          <input
            type="text"
            value={settings.site_name}
            onChange={(e) => onChange({ ...settings, site_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter site name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Email *
          </label>
          <input
            type="email"
            value={settings.admin_email}
            onChange={(e) => onChange({ ...settings, admin_email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="admin@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => onChange({ ...settings, timezone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="UTC+5">UTC+5 (Pakistan Standard Time)</option>
            <option value="UTC+0">UTC+0 (GMT)</option>
            <option value="UTC-5">UTC-5 (EST)</option>
            <option value="UTC-8">UTC-8 (PST)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Format
          </label>
          <select
            value={settings.date_format}
            onChange={(e) => onChange({ ...settings, date_format: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Items Per Page
          </label>
          <input
            type="number"
            min="5"
            max="100"
            value={settings.items_per_page}
            onChange={(e) => onChange({ ...settings, items_per_page: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Site Description
          </label>
          <textarea
            value={settings.site_description}
            onChange={(e) => onChange({ ...settings, site_description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of your platform"
          />
        </div>
      </div>
    </div>
  );
}

// Security Settings Component
function SecuritySettings({ settings, onChange }: { settings: SystemSettings['security'], onChange: (data: SystemSettings['security']) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            min="15"
            max="480"
            value={settings.session_timeout}
            onChange={(e) => onChange({ ...settings, session_timeout: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Password Length
          </label>
          <input
            type="number"
            min="4"
            max="20"
            value={settings.password_min_length}
            onChange={(e) => onChange({ ...settings, password_min_length: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Login Attempts
          </label>
          <input
            type="number"
            min="3"
            max="10"
            value={settings.max_login_attempts}
            onChange={(e) => onChange({ ...settings, max_login_attempts: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enable Two-Factor Authentication
            </label>
            <p className="text-sm text-gray-500">Add an extra layer of security to user accounts</p>
          </div>
          <button
            onClick={() => onChange({ ...settings, enable_2fa: !settings.enable_2fa })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.enable_2fa ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.enable_2fa ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enable CAPTCHA
            </label>
            <p className="text-sm text-gray-500">Protect against spam and automated attacks</p>
          </div>
          <button
            onClick={() => onChange({ ...settings, enable_captcha: !settings.enable_captcha })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.enable_captcha ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.enable_captcha ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// Notification Settings Component
function NotificationSettings({ settings, onChange }: { settings: SystemSettings['notifications'], onChange: (data: SystemSettings['notifications']) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Notifications
            </label>
            <p className="text-sm text-gray-500">Send notifications via email</p>
          </div>
          <button
            onClick={() => onChange({ ...settings, email_notifications: !settings.email_notifications })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.email_notifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.email_notifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SMS Notifications
            </label>
            <p className="text-sm text-gray-500">Send notifications via SMS</p>
          </div>
          <button
            onClick={() => onChange({ ...settings, sms_notifications: !settings.sms_notifications })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.sms_notifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.sms_notifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New User Alerts
            </label>
            <p className="text-sm text-gray-500">Get notified when new users register</p>
          </div>
          <button
            onClick={() => onChange({ ...settings, new_user_alerts: !settings.new_user_alerts })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.new_user_alerts ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.new_user_alerts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Alerts
            </label>
            <p className="text-sm text-gray-500">Get notified for payment activities</p>
          </div>
          <button
            onClick={() => onChange({ ...settings, payment_alerts: !settings.payment_alerts })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.payment_alerts ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.payment_alerts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              System Alerts
            </label>
            <p className="text-sm text-gray-500">Get notified for system events and errors</p>
          </div>
          <button
            onClick={() => onChange({ ...settings, system_alerts: !settings.system_alerts })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.system_alerts ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.system_alerts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// Payment Settings Component
function PaymentSettings({ settings, onChange }: { settings: SystemSettings['payment'], onChange: (data: SystemSettings['payment']) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Payment Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={settings.currency}
            onChange={(e) => onChange({ ...settings, currency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="PKR">PKR (₨)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Rate (%)
          </label>
          <input
            type="number"
            min="0"
            max="50"
            step="0.1"
            value={settings.tax_rate}
            onChange={(e) => onChange({ ...settings, tax_rate: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invoice Prefix
          </label>
          <input
            type="text"
            value={settings.invoice_prefix}
            onChange={(e) => onChange({ ...settings, invoice_prefix: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="INV"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Methods
        </label>
        <div className="space-y-2">
          {['stripe', 'paypal', 'bank_transfer', 'cash'].map((method) => (
            <label key={method} className="flex items-center">
              <input
                type="checkbox"
                checked={settings.payment_methods.includes(method)}
                onChange={(e) => {
                  const updatedMethods = e.target.checked
                    ? [...settings.payment_methods, method]
                    : settings.payment_methods.filter(m => m !== method);
                  onChange({ ...settings, payment_methods: updatedMethods });
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">
                {method.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Auto Renewal
          </label>
          <p className="text-sm text-gray-500">Automatically renew subscriptions</p>
        </div>
        <button
          onClick={() => onChange({ ...settings, auto_renewal: !settings.auto_renewal })}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            settings.auto_renewal ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.auto_renewal ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// Appearance Settings Component
function AppearanceSettings({ settings, onChange }: { settings: SystemSettings['appearance'], onChange: (data: SystemSettings['appearance']) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Appearance Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            value={settings.theme}
            onChange={(e) => onChange({ ...settings, theme: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={settings.primary_color}
              onChange={(e) => onChange({ ...settings, primary_color: e.target.value })}
              className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={settings.primary_color}
              onChange={(e) => onChange({ ...settings, primary_color: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={settings.language}
            onChange={(e) => onChange({ ...settings, language: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="ur">Urdu</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo URL
          </label>
          <input
            type="url"
            value={settings.logo_url}
            onChange={(e) => onChange({ ...settings, logo_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="/logo.png"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Favicon URL
          </label>
          <input
            type="url"
            value={settings.favicon_url}
            onChange={(e) => onChange({ ...settings, favicon_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="/favicon.ico"
          />
        </div>
      </div>

      {/* Color Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Color Presets
        </label>
        <div className="flex space-x-2">
          {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map((color) => (
            <button
              key={color}
              onClick={() => onChange({ ...settings, primary_color: color })}
              className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-300 transition-colors"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}