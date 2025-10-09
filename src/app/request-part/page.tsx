'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RequestPartForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    partName: '',
    partNumber: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',

    description: '',
    condition: 'new',
    budget: '',
    quantity: '1',
    location: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  });

  // Pre-populate form with URL parameters from home page
  useEffect(() => {
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const year = searchParams.get('year');
    const search = searchParams.get('search');

    if (make || model || year || search) {
      setFormData(prev => ({
        ...prev,
        vehicleMake: make || '',
        vehicleModel: model || '',
        vehicleYear: year || '',
        partName: search || prev.partName
      }));
    }
  }, [searchParams]);

  const isPrePopulated = formData.vehicleMake || formData.vehicleModel || formData.vehicleYear;

  const jamaicaParishes = [
    'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary',
    'St. Ann', 'Trelawny', 'St. James', 'Hanover', 'Westmoreland',
    'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Request submitted successfully! Sellers will contact you soon.');
    router.push('/my-requests');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-2">Request Auto Parts</h1>
          <p className="text-gray-600 mb-6">Tell us what you need and get competitive quotes from verified sellers</p>

          {/* Pre-populated data indicator */}
          {isPrePopulated && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Vehicle information pre-filled</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                We've automatically filled in your vehicle details. You can still edit them if needed.
              </p>
            </div>
          )}

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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 30 }, (_, i) => 2024 - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Make *</label>
                  <input
                    type="text"
                    name="vehicleMake"
                    value={formData.vehicleMake}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Toyota, Honda"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Model *</label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Camry, Civic"
                  />
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Please provide details about the part you need..."
              />
            </div>

            {/* Budget and Location */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Budget (JMD)</label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 5000-8000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Parish</option>
                  {jamaicaParishes.map(parish => (
                    <option key={parish} value={parish}>{parish}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone *</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700"
            >
              Submit Request
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
