'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  DollarSign,
  Clock,
  Truck,
  Shield,
  FileText,
  Camera,
  Check,
  AlertCircle,
  Package,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/useToast'; 

export default function SubmitQuotePage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(null);
  const { successmsg, errormsg, infomsg } = useToast(); 

  // Demo request data
  const demoRequest = {
    id: requestId,
    partName: 'Brake Pads Set',
    buyer: 'John Doe',
    vehicle: '2020 Toyota Camry',
    description: 'Front brake pads for 2020 Toyota Camry. Looking for ceramic pads with good quality.',
    budget: 'J$5,000 - J$10,000',
    urgency: 'normal',
    location: 'Kingston',
    dateCreated: '2024-01-15',
    expiresAt: '2024-01-22',
    contactName: 'John Doe',
    contactPhone: '+876 123 4567',
    contactEmail: 'john@example.com',
    oemNumber: '45022-SDA-A00',
    quantity: 1,
    condition: 'new'
  };

  const [quoteData, setQuoteData] = useState({
    // Part & Pricing Information
    partName: '',
    partNumber: '',
    brand: '',
    condition: 'new',
    price: '',
    originalPrice: '',
    quantity: 1,

    // Availability & Delivery
    availability: 'in_stock',
    deliveryTime: '1-2 days',
    deliveryMethod: 'pickup',
    deliveryFee: '',
    location: '',

    // Product Details
    description: '',
    features: [],
    warranty: '1 year',
    returnPolicy: '30 days',

    // Documents & Images
    images: [],
    documents: [],

    // Business Information
    businessName: 'Kingston Auto Parts',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',

    // Terms & Conditions
    paymentTerms: 'cash_on_delivery',
    specialInstructions: '',
    validUntil: '',

    // Quote Options
    alternativeOptions: [],
    bundleDiscount: '',
    bulkPricing: ''
  });

  useEffect(() => {
    // Load request data and pre-fill quote
    setRequest(demoRequest);
    setQuoteData(prev => ({
      ...prev,
      partName: demoRequest.partName,
      quantity: demoRequest.quantity || 1,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
    }));
  }, [demoRequest]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'number') {
      setQuoteData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setQuoteData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayChange = (field: string, value: string) => {
    setQuoteData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleFileUpload = (field: string, files: FileList) => {
    const fileArray = Array.from(files);
    setQuoteData(prev => ({
      ...prev,
      [field]: [...prev[field], ...fileArray]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!quoteData.price || !quoteData.description || !quoteData.availability) {
        throw new Error('Please fill in all required fields');
      }

     // console.log('Submitting quote...', quoteData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      successmsg('Quote submitted successfully! The buyer will be notified and can contact you directly.');
      router.push('/seller/dashboard');

    } catch (err: any) {
      console.error('Quote submission error:', err);
      setError(err.message || 'Failed to submit quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = () => {
    if (quoteData.originalPrice && quoteData.price) {
      const original = parseFloat(quoteData.originalPrice);
      const current = parseFloat(quoteData.price);
      if (original > current) {
        return Math.round(((original - current) / original) * 100);
      }
    }
    return 0;
  };

  const conditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'used_excellent', label: 'Used - Excellent' },
    { value: 'used_good', label: 'Used - Good' },
    { value: 'used_fair', label: 'Used - Fair' },
    { value: 'refurbished', label: 'Refurbished' },
    { value: 'oem', label: 'OEM' },
    { value: 'aftermarket', label: 'Aftermarket' }
  ];

  const availabilityOptions = [
    { value: 'in_stock', label: 'In Stock - Ready to Ship' },
    { value: 'low_stock', label: 'Low Stock - Limited Quantity' },
    { value: 'order_required', label: 'Need to Order - 3-5 Days' },
    { value: 'special_order', label: 'Special Order - 1-2 Weeks' },
    { value: 'out_of_stock', label: 'Currently Out of Stock' }
  ];

  const deliveryOptions = [
    { value: 'pickup', label: 'Customer Pickup' },
    { value: 'local_delivery', label: 'Local Delivery' },
    { value: 'island_wide', label: 'Island-wide Shipping' },
    { value: 'courier', label: 'Courier Service' }
  ];

  const paymentOptions = [
    { value: 'cash_on_delivery', label: 'Cash on Delivery' },
    { value: 'cash_on_pickup', label: 'Cash on Pickup' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'installments', label: 'Installment Plan' }
  ];

  const featureOptions = [
    'OEM Quality', 'Warranty Included', 'Free Installation Guide',
    'Technical Support', 'Money Back Guarantee', 'Fast Shipping',
    'Bulk Discount Available', 'Professional Installation Available'
  ];

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading request details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/seller/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">Submit Quote</h1>
          <p className="text-gray-600">Respond to buyer request with your best offer</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Request Details (Left Sidebar) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Request Details
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Part Needed</p>
                  <p className="text-gray-800">{request.partName}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700">Vehicle</p>
                  <p className="text-gray-800">{request.vehicle}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700">Budget</p>
                  <p className="text-green-600 font-bold">{request.budget}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700">Urgency</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    request.urgency === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.urgency}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700">Location</p>
                  <p className="text-gray-800 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {request.location}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700">Description</p>
                  <p className="text-gray-600 text-sm">{request.description}</p>
                </div>

                {request.oemNumber && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700">OEM Number</p>
                    <p className="text-gray-800 font-mono text-sm">{request.oemNumber}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Buyer Contact</p>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {request.contactPhone}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {request.contactEmail}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  <p>Request expires: {request.expiresAt}</p>
                  <p>Posted: {request.dateCreated}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Form (Main Content) */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Part Information */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-600" />
                  Part Information
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Part Name *</label>
                    <input
                      type="text"
                      name="partName"
                      value={quoteData.partName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Exact part name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Part Number</label>
                    <input
                      type="text"
                      name="partNumber"
                      value={quoteData.partNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="OEM or aftermarket number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={quoteData.brand}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Toyota, Bosch, OEM"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Condition *</label>
                    <select
                      name="condition"
                      value={quoteData.condition}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {conditionOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={quoteData.quantity}
                      onChange={handleChange}
                      min="1"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Warranty</label>
                    <select
                      name="warranty"
                      value={quoteData.warranty}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="no_warranty">No Warranty</option>
                      <option value="30_days">30 Days</option>
                      <option value="3_months">3 Months</option>
                      <option value="6_months">6 Months</option>
                      <option value="1_year">1 Year</option>
                      <option value="2_years">2 Years</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Part Description *</label>
                  <textarea
                    name="description"
                    value={quoteData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Detailed description of the part, its condition, features, and any important notes..."
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Features & Benefits</label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {featureOptions.map(feature => (
                      <label key={feature} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quoteData.features.includes(feature)}
                          onChange={() => handleArrayChange('features', feature)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  Pricing & Terms
                </h3>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Price (JMD) *</label>
                    <input
                      type="number"
                      name="price"
                      value={quoteData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="8500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (Optional)</label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={quoteData.originalPrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10000"
                    />
                    {calculateDiscount() > 0 && (
                      <p className="text-green-600 text-sm mt-1">
                        {calculateDiscount()}% discount
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quote Valid Until *</label>
                    <input
                      type="date"
                      name="validUntil"
                      value={quoteData.validUntil}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms *</label>
                    <select
                      name="paymentTerms"
                      value={quoteData.paymentTerms}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {paymentOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bulk Pricing</label>
                    <input
                      type="text"
                      name="bulkPricing"
                      value={quoteData.bulkPricing}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 5+ units: 10% off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bundle Discount</label>
                    <input
                      type="text"
                      name="bundleDiscount"
                      value={quoteData.bundleDiscount}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Buy brake pads + rotors: 15% off"
                    />
                  </div>
                </div>
              </div>

              {/* Availability & Delivery */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Truck className="w-6 h-6 text-purple-600" />
                  Availability & Delivery
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Availability *</label>
                    <select
                      name="availability"
                      value={quoteData.availability}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {availabilityOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Time *</label>
                    <select
                      name="deliveryTime"
                      value={quoteData.deliveryTime}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="same_day">Same Day</option>
                      <option value="next_day">Next Day</option>
                      <option value="1-2 days">1-2 Days</option>
                      <option value="3-5 days">3-5 Days</option>
                      <option value="1 week">1 Week</option>
                      <option value="2 weeks">2 Weeks</option>
                      <option value="1 month">1 Month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Method *</label>
                    <select
                      name="deliveryMethod"
                      value={quoteData.deliveryMethod}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {deliveryOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Fee (JMD)</label>
                    <input
                      type="number"
                      name="deliveryFee"
                      value={quoteData.deliveryFee}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0 for free delivery"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Location/Shop Address</label>
                  <input
                    type="text"
                    name="location"
                    value={quoteData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Main Street, Kingston"
                  />
                </div>
              </div>

              {/* Images & Documents */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Camera className="w-6 h-6 text-indigo-600" />
                  Images & Documents
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Part Images</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Upload photos of the actual part</p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB each</p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => e.target.files && handleFileUpload('images', e.target.files)}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="mt-2 inline-block cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors">
                        Choose Images
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Documents</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Upload receipts, certificates, manuals</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 5MB each</p>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => e.target.files && handleFileUpload('documents', e.target.files)}
                        className="hidden"
                        id="document-upload"
                      />
                      <label htmlFor="document-upload" className="mt-2 inline-block cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors">
                        Choose Documents
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Special Instructions & Notes</h3>

                <textarea
                  name="specialInstructions"
                  value={quoteData.specialInstructions}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special installation instructions, notes for the buyer, additional services offered, etc..."
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Link
                    href="/seller/dashboard"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting Quote...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Submit Quote
                      </>
                    )}
                  </button>
                </div>

                <p className="text-sm text-gray-500 mt-4 text-center">
                  By submitting this quote, you agree to provide the part as described and honor the terms stated above.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
