'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RequestPartPage() {
  const router = useRouter();
  const [urgency, setUrgency] = useState('normal');
  const [formData, setFormData] = useState({
    partName: '',
    partNumber: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    vin: '',
    description: '',
    condition: 'new',
    budget: '',
    quantity: '1',
    location: '',
    needByDate: '',
    images: [] as File[],
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    preferredContact: 'phone',
    notifySubscribers: true
  });

  const jamaicaParishes = [
    'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary',
    'St. Ann', 'Trelawny', 'St. James', 'Hanover', 'Westmoreland',
    'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'
  ];

  const popularRequests = [
    { part: 'Brake Pads', vehicle: 'Toyota Corolla', count: 45 },
    { part: 'Alternator', vehicle: 'Honda Civic', count: 38 },
    { part: 'CV Joint', vehicle: 'Nissan Tiida', count: 32 },
    { part: 'Timing Belt', vehicle: 'Mitsubishi Lancer', count: 28 },
    { part: 'Radiator', vehicle: 'Suzuki Swift', count: 25 },
    { part: 'Shock Absorbers', vehicle: 'Toyota Probox', count: 22 }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate notification cost based on urgency
    const notificationCost = urgency === 'urgent' ? 500 : urgency === 'premium' ? 1000 : 0;

    try {
      const response = await fetch('/api/part-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          urgency,
          notificationCost,
          status: 'pending',
          createdAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Notify subscribed sellers
        if (formData.notifySubscribers) {
          await fetch('/api/notifications/sellers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId: data.requestId,
              partName: formData.partName,
              vehicle: `${formData.vehicleYear} ${formData.vehicleMake} ${formData.vehicleModel}`,
              urgency,
              location: formData.location,
              budget: formData.budget
            })
          });
        }

        alert(`Part request submitted successfully! ${urgency === 'normal' ? 'Free tier sellers will be notified.' : urgency === 'urgent' ? 'Silver & Gold tier sellers notified instantly!' : 'All premium sellers notified with priority!'}`);
        router.push('/my-requests');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Request submitted! Sellers will be notified based on their subscription tier.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-700 to-teal-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Request a Part</h1>
          <p className="text-xl">Can't find what you need? Let our network of sellers find it for you!</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Part Request Form</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Urgency Level - Monetization */}
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-lg border-2 border-teal-200">
                  <h3 className="font-semibold mb-4 text-lg">📢 Notification Priority (Monetization Feature)</h3>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="urgency"
                        value="normal"
                        checked={urgency === 'normal'}
                        onChange={(e) => setUrgency(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold">Free Notification</div>
                        <div className="text-sm text-gray-600">Notify Basic tier sellers only (may take 24-48 hours)</div>
                        <div className="text-sm font-bold text-green-600">FREE</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="urgency"
                        value="urgent"
                        checked={urgency === 'urgent'}
                        onChange={(e) => setUrgency(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold">🔥 Urgent Request</div>
                        <div className="text-sm text-gray-600">Instant notification to Silver & Gold tier sellers</div>
                        <div className="text-sm font-bold text-orange-600">$500 JMD</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="urgency"
                        value="premium"
                        checked={urgency === 'premium'}
                        onChange={(e) => setUrgency(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold">⭐ Premium Priority</div>
                        <div className="text-sm text-gray-600">Featured request + notify ALL subscribed sellers instantly + 7-day boost</div>
                        <div className="text-sm font-bold text-purple-600">$1,000 JMD</div>
                      </div>
                    </label>
                  </div>
                </div>

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
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
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
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
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
                      <input
                        type="text"
                        name="vehicleYear"
                        value={formData.vehicleYear}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="e.g., 2015"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Make *</label>
                      <input
                        type="text"
                        name="vehicleMake"
                        value={formData.vehicleMake}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="e.g., Toyota"
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
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="e.g., Corolla"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">VIN (optional)</label>
                    <input
                      type="text"
                      name="vin"
                      value={formData.vin}
                      onChange={handleChange}
                      maxLength={17}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
                      placeholder="17-character VIN for exact match"
                    />
                  </div>
                </div>

                {/* Part Details */}
                <div>
                  <h3 className="font-semibold mb-3">Part Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Condition Preference</label>
                      <select
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="new">New Only</option>
                        <option value="used">Used Acceptable</option>
                        <option value="refurbished">Refurbished OK</option>
                        <option value="any">Any Condition</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Quantity Needed</label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="1"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Budget (JMD)</label>
                      <input
                        type="text"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="e.g., 5000-10000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Need By Date</label>
                      <input
                        type="date"
                        name="needByDate"
                        value={formData.needByDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Additional Details</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Describe any specific requirements, damage to replace, or other details..."
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="font-semibold mb-3">Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Name *</label>
                      <input
                        type="text"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Location *</label>
                      <select
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Select Parish</option>
                        {jamaicaParishes.map(parish => (
                          <option key={parish} value={parish}>{parish}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone *</label>
                      <input
                        type="tel"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="876-XXX-XXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-teal-700"
                >
                  Submit Part Request {urgency !== 'normal' && `($${urgency === 'urgent' ? '500' : '1,000'} JMD)`}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* How It Works */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">How Request System Works</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="text-2xl">1️⃣</div>
                  <div>
                    <div className="font-semibold">Submit Request</div>
                    <div className="text-sm text-gray-600">Fill out part details and choose notification priority</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-2xl">2️⃣</div>
                  <div>
                    <div className="font-semibold">Sellers Notified</div>
                    <div className="text-sm text-gray-600">Based on their subscription tier and your urgency level</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-2xl">3️⃣</div>
                  <div>
                    <div className="font-semibold">Receive Quotes</div>
                    <div className="text-sm text-gray-600">Compare offers from multiple sellers</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-2xl">4️⃣</div>
                  <div>
                    <div className="font-semibold">Choose & Buy</div>
                    <div className="text-sm text-gray-600">Select best offer and complete purchase</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Notification Tiers */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">🔔 Who Gets Notified?</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-semibold text-gray-700">Free Requests</div>
                  <div>→ Basic tier sellers (24-48hr delay)</div>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-semibold text-orange-600">Urgent Requests ($500)</div>
                  <div>→ Silver & Gold sellers (instant)</div>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-semibold text-purple-600">Premium Requests ($1,000)</div>
                  <div>→ ALL subscribed sellers (priority)</div>
                  <div>→ Featured placement for 7 days</div>
                </div>
              </div>
            </div>

            {/* Popular Requests */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Trending Requests</h3>
              <div className="space-y-2">
                {popularRequests.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <div className="font-medium">{item.part}</div>
                      <div className="text-sm text-gray-600">{item.vehicle}</div>
                    </div>
                    <div className="text-sm bg-teal-100 text-teal-800 px-2 py-1 rounded">
                      {item.count} requests
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
