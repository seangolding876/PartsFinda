'use client';

import { useState } from 'react';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    adminEmail: string;
    timezone: string;
    dateFormat: string;
    itemsPerPage: number;
  };
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    maxLoginAttempts: number;
    enable2FA: boolean;
    enableCaptcha: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    newUserAlerts: boolean;
    paymentAlerts: boolean;
    systemAlerts: boolean;
  };
  payment: {
    currency: string;
    taxRate: number;
    paymentMethods: string[];
    autoRenewal: boolean;
    invoicePrefix: string;
  };
  appearance: {
    theme: string;
    primaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    language: string;
  };
}

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'payment' | 'appearance'>('general');
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'PartsFinda',
      siteDescription: 'Auto Parts Marketplace',
      adminEmail: 'admin@partsfinda.com',
      timezone: 'UTC+5',
      dateFormat: 'DD/MM/YYYY',
      itemsPerPage: 20
    },
    security: {
      sessionTimeout: 60,
      passwordMinLength: 6,
      maxLoginAttempts: 5,
      enable2FA: false,
      enableCaptcha: true
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      newUserAlerts: true,
      paymentAlerts: true,
      systemAlerts: true
    },
    payment: {
      currency: 'USD',
      taxRate: 0,
      paymentMethods: ['stripe', 'paypal'],
      autoRenewal: true,
      invoicePrefix: 'INV'
    },
    appearance: {
      theme: 'light',
      primaryColor: '#3B82F6',
      logoUrl: '/logo.png',
      faviconUrl: '/favicon.ico',
      language: 'en'
    }
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Settings saved:', settings);
    setSaving(false);
    alert('Settings saved successfully!');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        general: {
          siteName: 'PartsFinda',
          siteDescription: 'Auto Parts Marketplace',
          adminEmail: 'admin@partsfinda.com',
          timezone: 'UTC+5',
          dateFormat: 'DD/MM/YYYY',
          itemsPerPage: 20
        },
        security: {
          sessionTimeout: 60,
          passwordMinLength: 6,
          maxLoginAttempts: 5,
          enable2FA: false,
          enableCaptcha: true
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          newUserAlerts: true,
          paymentAlerts: true,
          systemAlerts: true
        },
        payment: {
          currency: 'USD',
          taxRate: 0,
          paymentMethods: ['stripe', 'paypal'],
          autoRenewal: true,
          invoicePrefix: 'INV'
        },
        appearance: {
          theme: 'light',
          primaryColor: '#3B82F6',
          logoUrl: '/logo.png',
          faviconUrl: '/favicon.ico',
          language: 'en'
        }
      });
    }
  };

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
                onChange={(data) => setSettings(prev => ({ ...prev, general: data }))} 
              />
            )}
            {activeTab === 'security' && (
              <SecuritySettings 
                settings={settings.security} 
                onChange={(data) => setSettings(prev => ({ ...prev, security: data }))} 
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationSettings 
                settings={settings.notifications} 
                onChange={(data) => setSettings(prev => ({ ...prev, notifications: data }))} 
              />
            )}
            {activeTab === 'payment' && (
              <PaymentSettings 
                settings={settings.payment} 
                onChange={(data) => setSettings(prev => ({ ...prev, payment: data }))} 
              />
            )}
            {activeTab === 'appearance' && (
              <AppearanceSettings 
                settings={settings.appearance} 
                onChange={(data) => setSettings(prev => ({ ...prev, appearance: data }))} 
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
                onClick={() => console.log('Cancel')}
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
            value={settings.siteName}
            onChange={(e) => onChange({ ...settings, siteName: e.target.value })}
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
            value={settings.adminEmail}
            onChange={(e) => onChange({ ...settings, adminEmail: e.target.value })}
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
            value={settings.dateFormat}
            onChange={(e) => onChange({ ...settings, dateFormat: e.target.value })}
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
            value={settings.itemsPerPage}
            onChange={(e) => onChange({ ...settings, itemsPerPage: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Site Description
          </label>
          <textarea
            value={settings.siteDescription}
            onChange={(e) => onChange({ ...settings, siteDescription: e.target.value })}
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
            value={settings.sessionTimeout}
            onChange={(e) => onChange({ ...settings, sessionTimeout: parseInt(e.target.value) })}
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
            value={settings.passwordMinLength}
            onChange={(e) => onChange({ ...settings, passwordMinLength: parseInt(e.target.value) })}
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
            value={settings.maxLoginAttempts}
            onChange={(e) => onChange({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
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
            onClick={() => onChange({ ...settings, enable2FA: !settings.enable2FA })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.enable2FA ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.enable2FA ? 'translate-x-5' : 'translate-x-0'
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
            onClick={() => onChange({ ...settings, enableCaptcha: !settings.enableCaptcha })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.enableCaptcha ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.enableCaptcha ? 'translate-x-5' : 'translate-x-0'
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
            onClick={() => onChange({ ...settings, emailNotifications: !settings.emailNotifications })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
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
            onClick={() => onChange({ ...settings, smsNotifications: !settings.smsNotifications })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.smsNotifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.smsNotifications ? 'translate-x-5' : 'translate-x-0'
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
            onClick={() => onChange({ ...settings, newUserAlerts: !settings.newUserAlerts })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.newUserAlerts ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.newUserAlerts ? 'translate-x-5' : 'translate-x-0'
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
            onClick={() => onChange({ ...settings, paymentAlerts: !settings.paymentAlerts })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.paymentAlerts ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.paymentAlerts ? 'translate-x-5' : 'translate-x-0'
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
            onClick={() => onChange({ ...settings, systemAlerts: !settings.systemAlerts })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.systemAlerts ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.systemAlerts ? 'translate-x-5' : 'translate-x-0'
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
            value={settings.taxRate}
            onChange={(e) => onChange({ ...settings, taxRate: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invoice Prefix
          </label>
          <input
            type="text"
            value={settings.invoicePrefix}
            onChange={(e) => onChange({ ...settings, invoicePrefix: e.target.value })}
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
                checked={settings.paymentMethods.includes(method)}
                onChange={(e) => {
                  const updatedMethods = e.target.checked
                    ? [...settings.paymentMethods, method]
                    : settings.paymentMethods.filter(m => m !== method);
                  onChange({ ...settings, paymentMethods: updatedMethods });
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
          onClick={() => onChange({ ...settings, autoRenewal: !settings.autoRenewal })}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            settings.autoRenewal ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.autoRenewal ? 'translate-x-5' : 'translate-x-0'
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
              value={settings.primaryColor}
              onChange={(e) => onChange({ ...settings, primaryColor: e.target.value })}
              className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={settings.primaryColor}
              onChange={(e) => onChange({ ...settings, primaryColor: e.target.value })}
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
            value={settings.logoUrl}
            onChange={(e) => onChange({ ...settings, logoUrl: e.target.value })}
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
            value={settings.faviconUrl}
            onChange={(e) => onChange({ ...settings, faviconUrl: e.target.value })}
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
              onClick={() => onChange({ ...settings, primaryColor: color })}
              className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-300 transition-colors"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}