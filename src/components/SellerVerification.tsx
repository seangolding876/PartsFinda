'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Shield, CheckCircle, AlertCircle, X, Loader, Award, Star } from 'lucide-react';

interface VerificationProps {
  sellerEmail: string;
  onSuccess?: (data: any) => void;
  onClose?: () => void;
}

interface UploadedDocument {
  file: File;
  type: string;
  preview?: string;
}

const PARISHES = [
  'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary',
  'St. Ann', 'Trelawny', 'St. James', 'Hanover', 'Westmoreland',
  'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'
];

export default function SellerVerification({ sellerEmail, onSuccess, onClose }: VerificationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  // Form data
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'individual',
    taxRegistrationNumber: '',
    businessRegistrationNumber: '',
    phoneNumber: '',
    businessAddress: '',
    parish: '',
    websiteUrl: '',
    yearsInBusiness: ''
  });

  // Documents
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const fileInputRefs = {
    trn: useRef<HTMLInputElement>(null),
    brn: useRef<HTMLInputElement>(null),
    id: useRef<HTMLInputElement>(null),
    address: useRef<HTMLInputElement>(null)
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDocumentUpload = (type: string, file: File) => {
    // Validate file
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload PDF, JPG, or PNG files only');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Add to documents
    const newDoc: UploadedDocument = {
      file,
      type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    };

    setDocuments(prev => [...prev.filter(d => d.type !== type), newDoc]);
    setError('');
  };

  const removeDocument = (type: string) => {
    setDocuments(prev => prev.filter(d => d.type !== type));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      // Create FormData
      const formDataToSend = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      formDataToSend.append('sellerEmail', sellerEmail);

      // Add documents
      documents.forEach(doc => {
        formDataToSend.append(`document_${doc.type}`, doc.file);
      });

      const response = await fetch('/api/seller/verification', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationStatus(data);
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        setError(data.error || 'Verification submission failed');
      }
    } catch (err) {
      setError('Failed to submit verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getBadgeDisplay = (badge: any) => {
    if (!badge) return null;

    const icons = {
      check: <CheckCircle className="w-5 h-5" />,
      shield: <Shield className="w-5 h-5" />,
      star: <Star className="w-5 h-5" />
    };

    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      gold: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border ${colors[badge.color as keyof typeof colors]}`}>
        {icons[badge.icon as keyof typeof icons]}
        <span className="font-semibold capitalize">{badge.type} Seller</span>
      </div>
    );
  };

  // Success view
  if (verificationStatus) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="text-center">
          {verificationStatus.status === 'approved' ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Verification Approved!</h2>
              <p className="text-gray-600 mb-6">
                Your seller account has been verified successfully.
              </p>
              <div className="mb-6">
                {getBadgeDisplay(verificationStatus.badge)}
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Verification Level: <span className="font-semibold capitalize">{verificationStatus.verificationLevel}</span>
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-12 h-12 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Verification Pending</h2>
              <p className="text-gray-600 mb-6">
                Your verification request has been submitted and is under review.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Estimated review time: {verificationStatus.estimatedReviewTime}
              </p>
            </>
          )}

          <button
            onClick={() => window.location.href = '/seller/dashboard'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Seller Verification</h2>
          <p className="text-gray-600 mt-1">Get verified to build trust with buyers</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map(step => (
          <div key={step} className="flex items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`flex-1 h-1 mx-2 ${
                currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Business Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold mb-4">Business Information</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Business Type *</label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">TRN (Tax Registration Number)</label>
              <input
                type="text"
                name="taxRegistrationNumber"
                value={formData.taxRegistrationNumber}
                onChange={handleInputChange}
                placeholder="XXX-XXX-XXX"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">BRN (Business Registration Number)</label>
              <input
                type="text"
                name="businessRegistrationNumber"
                value={formData.businessRegistrationNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="876-XXX-XXXX"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Years in Business</label>
              <input
                type="number"
                name="yearsInBusiness"
                value={formData.yearsInBusiness}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Business Address *</label>
            <input
              type="text"
              name="businessAddress"
              value={formData.businessAddress}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Parish *</label>
              <select
                name="parish"
                value={formData.parish}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Parish</option>
                {PARISHES.map(parish => (
                  <option key={parish} value={parish}>{parish}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Website URL</label>
              <input
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={!formData.businessName || !formData.phoneNumber || !formData.businessAddress || !formData.parish}
            >
              Next: Upload Documents
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Document Upload */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
          <p className="text-gray-600 mb-6">
            Upload documents to verify your business. The more documents you provide, the higher your verification level.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* TRN Document */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">TRN Document</h4>
                  <p className="text-sm text-gray-600">Tax Registration Certificate</p>
                </div>
                {documents.find(d => d.type === 'trn') && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>

              <input
                ref={fileInputRefs.trn}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files && handleDocumentUpload('trn', e.target.files[0])}
                className="hidden"
              />

              {documents.find(d => d.type === 'trn') ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">Document uploaded</span>
                  <button
                    onClick={() => removeDocument('trn')}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRefs.trn.current?.click()}
                  className="w-full px-3 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload TRN
                </button>
              )}
            </div>

            {/* BRN Document */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">BRN Document</h4>
                  <p className="text-sm text-gray-600">Business Registration</p>
                </div>
                {documents.find(d => d.type === 'brn') && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>

              <input
                ref={fileInputRefs.brn}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files && handleDocumentUpload('brn', e.target.files[0])}
                className="hidden"
              />

              {documents.find(d => d.type === 'brn') ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">Document uploaded</span>
                  <button
                    onClick={() => removeDocument('brn')}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRefs.brn.current?.click()}
                  className="w-full px-3 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload BRN
                </button>
              )}
            </div>

            {/* ID Document */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">ID Document</h4>
                  <p className="text-sm text-gray-600">Driver's License or National ID</p>
                </div>
                {documents.find(d => d.type === 'id') && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>

              <input
                ref={fileInputRefs.id}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files && handleDocumentUpload('id', e.target.files[0])}
                className="hidden"
              />

              {documents.find(d => d.type === 'id') ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">Document uploaded</span>
                  <button
                    onClick={() => removeDocument('id')}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRefs.id.current?.click()}
                  className="w-full px-3 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload ID
                </button>
              )}
            </div>

            {/* Address Proof */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">Address Proof</h4>
                  <p className="text-sm text-gray-600">Utility Bill or Bank Statement</p>
                </div>
                {documents.find(d => d.type === 'address') && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>

              <input
                ref={fileInputRefs.address}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files && handleDocumentUpload('address', e.target.files[0])}
                className="hidden"
              />

              {documents.find(d => d.type === 'address') ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">Document uploaded</span>
                  <button
                    onClick={() => removeDocument('address')}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRefs.address.current?.click()}
                  className="w-full px-3 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload Proof
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={documents.length === 0}
            >
              Next: Review & Submit
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>

          {/* Verification Level Preview */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h4 className="font-semibold mb-3">Expected Verification Level</h4>
            {documents.length >= 2 && formData.taxRegistrationNumber && formData.businessRegistrationNumber ? (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Star className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="font-bold text-lg">Premium Verification</p>
                    <p className="text-sm text-gray-600">Highest level of trust with all documents verified</p>
                  </div>
                </div>
              </div>
            ) : documents.length >= 1 && (formData.taxRegistrationNumber || formData.businessRegistrationNumber) ? (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="font-bold text-lg">Standard Verification</p>
                    <p className="text-sm text-gray-600">Trusted seller with key documents verified</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-bold text-lg">Basic Verification</p>
                    <p className="text-sm text-gray-600">Verified seller with basic documentation</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Verification Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Business Name:</span>
                <span className="font-medium">{formData.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Business Type:</span>
                <span className="font-medium capitalize">{formData.businessType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Parish:</span>
                <span className="font-medium">{formData.parish}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Documents Uploaded:</span>
                <span className="font-medium">{documents.length}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Award className="w-5 h-5" />
                  Submit for Verification
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
