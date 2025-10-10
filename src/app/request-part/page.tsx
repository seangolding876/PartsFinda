'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Auth utility functions
const getAuthData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const authData = localStorage.getItem('authData');
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    return null;
  }
};

const isAuthenticated = () => {
  const authData = getAuthData();
  return !!(authData?.token);
};

interface Make {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
}

function RequestPartForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  const [formData, setFormData] = useState({
    partName: '',
    partNumber: '',
    vehicleYear: '',
    makeId: '',
    modelId: '',
    description: '',
    condition: 'any' as 'new' | 'used' | 'refurbished' | 'any',
    budget: '',
    parish: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
  });

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      alert('Please login to submit a part request');
      router.push('/auth/login');
    } else {
      setAuthChecked(true);
      fetchMakes();
    }
  }, [router]);

  // Fetch models when make is selected
  useEffect(() => {
    if (formData.makeId) {
      fetchModels(formData.makeId);
    } else {
      setModels([]);
    }
  }, [formData.makeId]);

  const fetchMakes = async () => {
    try {
      setFetchLoading(true);
      console.log('🔄 Fetching makes...');
      
      const response = await fetch('/api/part-requests?action=getMakes');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Loaded ${result.data.length} makes`);
        setMakes(result.data);
      } else {
        console.error('❌ Failed to fetch makes:', result.error);
      }
    } catch (error) {
      console.error('❌ Error fetching makes:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchModels = async (makeId: string) => {
    try {
      setFetchLoading(true);
      console.log(`🔄 Fetching models for make: ${makeId}`);
      
      const response = await fetch(`/api/part-requests?action=getModels&makeId=${makeId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Loaded ${result.data.length} models`);
        setModels(result.data);
      } else {
        console.error('❌ Failed to fetch models:', result.error);
        setModels([]);
      }
    } catch (error) {
      console.error('❌ Error fetching models:', error);
      setModels([]);
    } finally {
      setFetchLoading(false);
    }
  };

  const jamaicaParishes = [
    'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary',
    'St. Ann', 'Trelawny', 'St. James', 'Hanover', 'Westmoreland',
    'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated()) {
      alert('Please login to submit a part request');
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    
    try {
      const authData = getAuthData();
      
      console.log('🔄 Submitting part request with token...');
      
      const response = await fetch('/api/part-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          ...formData,
          vehicleYear: parseInt(formData.vehicleYear),
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Request submitted successfully! Sellers will contact you soon.');
        router.push('/my-requests');
      } else {
        alert('❌ Failed to submit request: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('❌ Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-2">Request Auto Parts</h1>
          <p className="text-gray-600 mb-6">Tell us what you need and get competitive quotes from verified sellers</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Part Information */}
            <div>
              <h3 className="font-semibold mb-3">Part Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Part Name *</label>
                  <input
                    type="text"
                    name="partName"
                    value={formData.partName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Brake Pads, Alternator"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Part Number (if known)</label>
                  <input
                    type="text"
                    name="partNumber"
                    value={formData.partNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="OEM or aftermarket number"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div>
              <h3 className="font-semibold mb-3">Vehicle Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Year *</label>
                  <select
                    name="vehicleYear"
                    value={formData.vehicleYear}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 30 }, (_, i) => 2024 - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Make *</label>
                  <select
                    name="makeId"
                    value={formData.makeId}
                    onChange={handleChange}
                    required
                    disabled={fetchLoading}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{fetchLoading ? 'Loading makes...' : 'Select Make'}</option>
                    {makes.map(make => (
                      <option key={make.id} value={make.id}>{make.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Model *</label>
                  <select
                    name="modelId"
                    value={formData.modelId}
                    onChange={handleChange}
                    required
                    disabled={!formData.makeId || fetchLoading}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!formData.makeId ? 'Select make first' : fetchLoading ? 'Loading models...' : 'Select Model'}
                    </option>
                    {models.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please provide details about the part you need..."
              />
            </div>

            {/* Additional Details */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Condition</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="any">Any Condition</option>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Budget (JMD)</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Parish</label>
                <select
                  name="parish"
                  value={formData.parish}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Parish</option>
                  {jamaicaParishes.map(parish => (
                    <option key={parish} value={parish}>{parish}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Request'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RequestPartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <RequestPartForm />
    </Suspense>
  );
}