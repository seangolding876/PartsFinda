'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/useToast';

// Auth utility functions
const getAuthData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const authData = localStorage.getItem('authData');
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    console.error('❌ Error getting auth data:', error);
    return null;
  }
};

// Send Email Demo
useEffect(() => {
  const sendNotificationEmail = async () => {
    try {
      const response = await fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'adnan.shafi91@gmail.com',
          subject: 'PartsFinda Page Opened',
          html: `
            <div style="font-family: Arial; padding: 16px;">
              <h2>🚀 Page Opened</h2>
              <p>This email was automatically triggered when someone opened the Part Requests page.</p>
              <p><b>Timestamp:</b> ${new Date().toLocaleString()}</p>
            </div>
          `,
        }),
      });

      const result = await response.json();
      console.log('📧 Mail result:', result);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
    }
  };

  sendNotificationEmail();
}, []);

const isAuthenticated = () => {
  const authData = getAuthData();
  if (!authData?.token) {
    console.log('❌ No authentication token found');
    return false;
  }
  return true;
};

interface Make {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
}

interface FormData {
  partName: string;
  partNumber: string;
  vehicleYear: string;
  makeId: string;
  modelId: string;
  description: string;
  condition: 'new' | 'used' | 'refurbished' | 'any';
  budget: string;
  parish: string;
  urgency: 'low' | 'medium' | 'high';
}

function RequestPartForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string>('');
  const { successmsg, infomsg, errormsg } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    partName: '',
    partNumber: '',
    vehicleYear: '',
    makeId: '',
    modelId: '',
    description: '',
    condition: 'any',
    budget: '',
    parish: '',
    urgency: 'medium',
  });

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        // console.log('🚫 User not authenticated, redirecting to login');
        // alert('Please login to submit a part request');
        errormsg('Please login to submit a part request');
        router.push('/auth/login');
      } else {
        // console.log('✅ User authenticated');
        setAuthChecked(true);
        fetchMakes();
      }
    };

    checkAuth();
  }, [router]);

  // Fetch models when make is selected
  useEffect(() => {
    if (formData.makeId) {
      // console.log(`🔄 Make selected: ${formData.makeId}, fetching models...`);
      fetchModels(formData.makeId);
    } else {
      setModels([]);
      setFormData(prev => ({ ...prev, modelId: '' }));
    }
  }, [formData.makeId]);

  const fetchMakes = async () => {
    try {
      setFetchLoading(true);
      setError('');
      // console.log('🔄 Fetching makes...');
      
      const response = await fetch('/api/part-requests?action=getMakes');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // console.log(`✅ Loaded ${result.data.length} makes`);
        setMakes(result.data);
      } else {
        console.error('❌ Failed to fetch makes:', result.error);
        setError('Failed to load vehicle makes');
      }
    } catch (error) {
      // console.error('❌ Error fetching makes:', error);
      setError('Failed to load vehicle makes. Please refresh the page.');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchModels = async (makeId: string) => {
    try {
      setFetchLoading(true);
      setError('');
      // console.log(`🔄 Fetching models for make: ${makeId}`);
      
      const response = await fetch(`/api/part-requests?action=getModels&makeId=${makeId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // console.log(`✅ Loaded ${result.data.length} models`);
        setModels(result.data);
      } else {
        // console.error('❌ Failed to fetch models:', result.error);
        errormsg('Failed to load vehicle models', result.error);
        setModels([]);
        setError('Failed to load vehicle models');
      }
    } catch (error) {
       errormsg('Failed to load vehicle models', error);
      setModels([]);
      setError('Failed to load vehicle models');
    } finally {
      setFetchLoading(false);
    }
  };

  const jamaicaParishes = [
    'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary',
    'St. Ann', 'Trelawny', 'St. James', 'Hanover', 'Westmoreland',
    'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'
  ];

  const validateForm = (): boolean => {
    const requiredFields: (keyof FormData)[] = [
      'partName', 'vehicleYear', 'makeId', 'modelId', 'description', 'parish'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      const fieldNames = {
        partName: 'Part Name',
        vehicleYear: 'Vehicle Year',
        makeId: 'Make',
        modelId: 'Model',
        description: 'Description',
        parish: 'Parish'
      };
      
      const missingFieldNames = missingFields.map(field => fieldNames[field]);
      setError(`Please fill in all required fields: ${missingFieldNames.join(', ')}`);
      return false;
    }

    if (formData.vehicleYear) {
      const year = parseInt(formData.vehicleYear);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 1) {
        setError('Please select a valid vehicle year');
        return false;
      }
    }

    if (formData.budget && parseFloat(formData.budget) < 0) {
      setError('Budget cannot be negative');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated()) {
      errormsg('Please login to submit a part request');
      router.push('/auth/login');
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const authData = getAuthData();
      
      if (!authData?.token) {
        throw new Error('No authentication token found');
      }

      // console.log('🔄 Submitting part request...', formData);

      // Prepare request data
      const requestData = {
        ...formData,
        vehicleYear: parseInt(formData.vehicleYear),
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      };

      // console.log('📦 Sending request data:', requestData);

      const response = await fetch('/api/part-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      // console.log('📨 API Response:', result);

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      if (result.success) {
        // console.log('✅ Request submitted successfully:', result.data);
        // alert('✅ Request submitted successfully! Sellers will contact you soon.');
        successmsg('Request submitted successfully! Sellers will contact you soon.');
        
        // Reset form
        setFormData({
          partName: '',
          partNumber: '',
          vehicleYear: '',
          makeId: '',
          modelId: '',
          description: '',
          condition: 'any',
          budget: '',
          parish: '',
          urgency: 'medium',
        });
        
        // Redirect to requests page
        router.push('/my-requests');
      } else {
        throw new Error(result.error || 'Failed to submit request');
      }
    } catch (error: any) {
      // console.error('❌ Error submitting request:', error);
      errormsg('Failed to submit request', error);
      
      let errorMessage = 'Failed to submit request. Please try again.';
      
      if (error.message.includes('Authentication')) {
        errorMessage = 'Authentication failed. Please login again.';
        router.push('/auth/login');
      } else if (error.message.includes('Invalid make') || error.message.includes('Invalid model')) {
        errorMessage = 'Invalid vehicle selection. Please check your vehicle details.';
      } else if (error.message.includes('Missing required')) {
        errorMessage = 'Please fill in all required fields.';
      }
      
      setError(errorMessage);
      // alert(`❌ ${errorMessage}`);
      errormsg(`Error: ${errorMessage}`);
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
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Request Auto Parts</h1>
            <p className="text-gray-600">
              Tell us what you need and get competitive quotes from verified sellers
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Part Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 text-gray-800">Part Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Part Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="partName"
                    value={formData.partName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., Brake Pads, Alternator, Headlights"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Part Number (if known)</label>
                  <input
                    type="text"
                    name="partNumber"
                    value={formData.partNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="OEM or aftermarket number"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 text-gray-800">Vehicle Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="vehicleYear"
                    value={formData.vehicleYear}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 30 }, (_, i) => 2024 - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Make <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="makeId"
                    value={formData.makeId}
                    onChange={handleChange}
                    required
                    disabled={fetchLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{fetchLoading ? 'Loading makes...' : 'Select Make'}</option>
                    {makes.map(make => (
                      <option key={make.id} value={make.id}>{make.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="modelId"
                    value={formData.modelId}
                    onChange={handleChange}
                    required
                    disabled={!formData.makeId || fetchLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Please provide detailed information about the part you need, including any specific requirements, symptoms, or additional context that might help sellers understand your request better..."
              />
            </div>

            {/* Additional Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 text-gray-800">Additional Details</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Condition Preference</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., 5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Parish <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="parish"
                    value={formData.parish}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select Parish</option>
                    {jamaicaParishes.map(parish => (
                      <option key={parish} value={parish}>{parish}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Urgency Field */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Urgency</label>
                <div className="flex space-x-4">
                  {(['low', 'medium', 'high'] as const).map(level => (
                    <label key={level} className="flex items-center">
                      <input
                        type="radio"
                        name="urgency"
                        value={level}
                        checked={formData.urgency === level}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting Request...
                </span>
              ) : (
                'Submit Request'
              )}
            </button>

            {/* Required Fields Note */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Fields marked with <span className="text-red-500">*</span> are required
              </p>
            </div>
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
          <p className="mt-4 text-gray-600">Loading Request Form...</p>
        </div>
      </div>
    }>
      <RequestPartForm />
    </Suspense>
  );
}