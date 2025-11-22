'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Upload, Building, MapPin, Phone, Mail, User, FileText, CreditCard, Star, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export default function SellerSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [sellerForm, setSellerForm] = useState({
    // Personal Information
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',

    // Business Information
    businessName: '',
    businessType: 'auto_parts_shop',
    businessRegistrationNumber: '',
    taxId: '',
    yearsInBusiness: '',

    // Location & Contact
    address: '',
    parish: '',
    city: '',
    postalCode: '',
    businessPhone: '',
    businessEmail: '',
    website: '',

    // Specializations
    specializations: [],
    vehicleBrands: [],
    partCategories: [],

    // Business Documents
    businessLicense: null as File | null,
    taxCertificate: null as File | null,
    insuranceCertificate: null as File | null,

    // Membership Plan
    membershipPlan: 'basic',

    // Terms & Verification
    agreeToTerms: false,
    agreeToVerification: false
  });

  const steps = [
    { number: 1, title: 'Personal Info', icon: <User className="w-5 h-5" /> },
    { number: 2, title: 'Business Details', icon: <Building className="w-5 h-5" /> },
    { number: 3, title: 'Location & Contact', icon: <MapPin className="w-5 h-5" /> },
    { number: 4, title: 'Specializations', icon: <Star className="w-5 h-5" /> },
    { number: 5, title: 'Documents', icon: <FileText className="w-5 h-5" /> },
    { number: 6, title: 'Membership', icon: <CreditCard className="w-5 h-5" /> }
  ];

  const jamaicaParishes = [
    'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary',
    'St. Ann', 'Trelawny', 'St. James', 'Hanover', 'Westmoreland',
    'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'
  ];

  const businessTypes = [
    { value: 'auto_parts_shop', label: 'Auto Parts Shop' },
    { value: 'mechanic_shop', label: 'Mechanic Shop' },
    { value: 'dealer', label: 'Vehicle Dealer' },
    { value: 'distributor', label: 'Parts Distributor' },
    { value: 'manufacturer', label: 'Parts Manufacturer' },
    { value: 'individual', label: 'Individual Seller' }
  ];

  const specializationOptions = [
    'Engine Parts', 'Brake Systems', 'Suspension', 'Electrical',
    'Transmission', 'Body Parts', 'Filters', 'Oil & Fluids',
    'Tires & Wheels', 'Exhaust System', 'Cooling System', 'Interior Parts'
  ];

  const vehicleBrandOptions = [
    'Toyota', 'Honda', 'Nissan', 'Mitsubishi', 'BMW', 'Mercedes-Benz',
    'Audi', 'Volkswagen', 'Ford', 'Chevrolet', 'Hyundai', 'Kia',
    'Mazda', 'Subaru', 'Suzuki', 'Isuzu'
  ];

  const membershipPlans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 'J$0',
      period: '/month',
      features: ['Basic listing', '24-hour response delay', 'Email notifications', 'Basic analytics'],
      recommended: false
    },
    {
      id: 'premium',
      name: 'Premium', 
      price: 'J$2,500',
      period: '/month',
      features: ['Priority listing', 'Instant notifications', 'Advanced analytics', 'Customer support'],
      recommended: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'J$5,000', 
      period: '/month',
      features: ['Top placement', 'Featured supplier badge', 'Bulk messaging', 'Dedicated account manager'],
      recommended: false
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSellerForm(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setSellerForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleMultiSelect = (field: string, value: string) => {
    setSellerForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleFileChange = (field: string, file: File | null) => {
   // console.log('📁 File upload:', field, file?.name);

    if (file) {
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('File size must be less than 5MB. Please choose a smaller file.');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF, JPG, and PNG files are allowed.');
        return;
      }

    //  console.log('✅ File valid:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    }

    setSellerForm(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const triggerFileInput = (inputId: string) => {
   // console.log('🖱️ Triggering file input:', inputId);
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.click();
    } else {
      console.error('❌ File input not found:', inputId);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>, field: string) => {
  //  console.log('📄 File input change:', field, event.target.files?.length, 'files');
    const file = event.target.files?.[0] || null;
    handleFileChange(field, file);

    // Reset the input value to allow re-uploading the same file
    event.target.value = '';
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(sellerForm.ownerName && sellerForm.email && sellerForm.phone &&
               sellerForm.password && sellerForm.confirmPassword &&
               sellerForm.password === sellerForm.confirmPassword);
      case 2:
        return !!(sellerForm.businessName && sellerForm.businessType && sellerForm.yearsInBusiness);
      case 3:
        return !!(sellerForm.address && sellerForm.parish && sellerForm.city && sellerForm.businessPhone);
      case 4:
        return sellerForm.specializations.length > 0;
      case 5:
        return true; // Documents are optional for now
      case 6:
        return !!(sellerForm.membershipPlan && sellerForm.agreeToTerms && sellerForm.agreeToVerification);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
      setError('');
    } else {
      setError('Please fill in all required fields before continuing.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) {
      setError('Please complete all required fields and agree to the terms.');
      return;
    }

    setLoading(true);
    setError('');

    try {
     // console.log('🚀 Starting seller registration with file uploads...');

      // File upload function
      const uploadFile = async (file: File | null, type: string): Promise<string | null> => {
        if (!file) {
         // console.log(`📄 No ${type} file to upload`);
          return null;
        }

       // console.log(`📤 Uploading ${type}:`, file.name);

        const uploadFormData = new FormData(); // ✅ Different variable name
        uploadFormData.append('file', file);
        uploadFormData.append('type', type);
        uploadFormData.append('sellerEmail', sellerForm.email); // ✅ sellerForm use karein

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Failed to upload ${type}`);
        }

     //   console.log(`✅ ${type} uploaded successfully:`, result.fileUrl);
        return result.fileUrl;
      };

      // Upload all files in parallel
      const uploadPromises = [
        uploadFile(sellerForm.businessLicense, 'business_license'),
        uploadFile(sellerForm.taxCertificate, 'tax_certificate'),
        uploadFile(sellerForm.insuranceCertificate, 'insurance_certificate'),
      ];

      const [businessLicenseUrl, taxCertificateUrl, insuranceCertificateUrl] = await Promise.all(uploadPromises);

      // console.log('📁 All files uploaded:', {
      //   businessLicense: businessLicenseUrl,
      //   taxCertificate: taxCertificateUrl,
      //   insuranceCertificate: insuranceCertificateUrl
      // });

      // Prepare registration data with actual file URLs
      const submissionData = {
        ownerName: sellerForm.ownerName,
        email: sellerForm.email,
        phone: sellerForm.phone,
        password: sellerForm.password,
        
        businessName: sellerForm.businessName,
        businessType: sellerForm.businessType,
        businessRegistrationNumber: sellerForm.businessRegistrationNumber || undefined,
        taxId: sellerForm.taxId || undefined,
        yearsInBusiness: sellerForm.yearsInBusiness,
        
        address: sellerForm.address,
        parish: sellerForm.parish,
        city: sellerForm.city,
        postalCode: sellerForm.postalCode || undefined,
        businessPhone: sellerForm.businessPhone,
        businessEmail: sellerForm.businessEmail || undefined,
        website: sellerForm.website || undefined,
        
        specializations: sellerForm.specializations,
        vehicleBrands: sellerForm.vehicleBrands,
        partCategories: sellerForm.partCategories || [],
        
        // ACTUAL FILE URLs
        businessLicense: businessLicenseUrl,
        taxCertificate: taxCertificateUrl,
        insuranceCertificate: insuranceCertificateUrl,
        
        membershipPlan: sellerForm.membershipPlan,
        
        agreeToTerms: sellerForm.agreeToTerms,
        agreeToVerification: sellerForm.agreeToVerification
      };

     // console.log('📨 Sending registration data to API...');

      const response = await fetch('/api/auth/seller-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      if (result.success) {
       // console.log('✅ Application submitted successfully:', result);
        const successUrl = `/auth/seller-application-submitted?applicationId=${result.data.applicationId}&businessName=${encodeURIComponent(result.data.businessName)}&email=${encodeURIComponent(result.data.email)}&membershipPlan=${encodeURIComponent(result.data.membershipPlan)}`;
        router.push(successUrl);
      } else {
        throw new Error(result.error || 'Application submission failed');
      }

    } catch (err: any) {
      console.error('❌ Application submission error:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Personal Information</h2>
              <p className="text-gray-600">Tell us about yourself as the business owner</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="ownerName"
                  value={sellerForm.ownerName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={sellerForm.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={sellerForm.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+876 XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={sellerForm.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={sellerForm.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Repeat your password"
                />
                {sellerForm.password && sellerForm.confirmPassword && sellerForm.password !== sellerForm.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Business Information</h2>
              <p className="text-gray-600">Details about your auto parts business</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  value={sellerForm.businessName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kingston Auto Parts Ltd."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
                <select
                  name="businessType"
                  value={sellerForm.businessType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years in Business *</label>
                <select
                  name="yearsInBusiness"
                  value={sellerForm.yearsInBusiness}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select years</option>
                  <option value="0-1">Less than 1 year</option>
                  <option value="1-3">1-3 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10+">More than 10 years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Registration Number</label>
                <input
                  type="text"
                  name="businessRegistrationNumber"
                  value={sellerForm.businessRegistrationNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Company registration number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID / TRN</label>
                <input
                  type="text"
                  name="taxId"
                  value={sellerForm.taxId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tax Registration Number"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Location & Contact</h2>
              <p className="text-gray-600">Where can customers find your business?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Address *</label>
                <input
                  type="text"
                  name="address"
                  value={sellerForm.address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main Street"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parish *</label>
                <select
                  name="parish"
                  value={sellerForm.parish}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Parish</option>
                  {jamaicaParishes.map(parish => (
                    <option key={parish} value={parish}>{parish}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City/Town *</label>
                <input
                  type="text"
                  name="city"
                  value={sellerForm.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kingston"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Phone *</label>
                <input
                  type="tel"
                  name="businessPhone"
                  value={sellerForm.businessPhone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+876 XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                <input
                  type="email"
                  name="businessEmail"
                  value={sellerForm.businessEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="info@business.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={sellerForm.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.business.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={sellerForm.postalCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kingston 10"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Specializations</h2>
              <p className="text-gray-600">What types of parts and vehicles do you specialize in?</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Part Categories *</h3>
                <p className="text-sm text-gray-600 mb-4">Select all categories that apply to your business</p>
                <div className="grid md:grid-cols-3 gap-3">
                  {specializationOptions.map(spec => (
                    <label key={spec} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sellerForm.specializations.includes(spec)}
                        onChange={() => handleMultiSelect('specializations', spec)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Vehicle Brands</h3>
                <p className="text-sm text-gray-600 mb-4">Which vehicle brands do you have parts for?</p>
                <div className="grid md:grid-cols-4 gap-3">
                  {vehicleBrandOptions.map(brand => (
                    <label key={brand} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sellerForm.vehicleBrands.includes(brand)}
                        onChange={() => handleMultiSelect('vehicleBrands', brand)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Business Documents</h2>
              <p className="text-gray-600">Upload your business verification documents (optional but recommended)</p>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Why verify your business?
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Get verified badge to build customer trust
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Higher ranking in search results
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Access to premium features
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Faster application approval
                  </li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-800 mb-2">Business License</h4>
                  <p className="text-sm text-gray-600 mb-4">Upload your business license or registration certificate</p>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                      sellerForm.businessLicense
                        ? 'border-green-400 bg-green-50 hover:border-green-500'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                    onClick={() => triggerFileInput('businessLicense')}
                  >
                    {sellerForm.businessLicense ? (
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    )}
                    <p className={`text-sm ${sellerForm.businessLicense ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                      {sellerForm.businessLicense ? `✅ ${sellerForm.businessLicense.name}` : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 5MB</p>
                    {sellerForm.businessLicense && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileChange('businessLicense', null);
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                  <input
                    id="businessLicense"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileInputChange(e, 'businessLicense')}
                  />
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-800 mb-2">Tax Certificate</h4>
                  <p className="text-sm text-gray-600 mb-4">Upload your tax compliance certificate</p>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => triggerFileInput('taxCertificate')}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {sellerForm.taxCertificate ? sellerForm.taxCertificate.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 5MB</p>
                  </div>
                  <input
                    id="taxCertificate"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileInputChange(e, 'taxCertificate')}
                  />
                </div>

                <div className="border border-gray-200 rounded-lg p-6 md:col-span-2">
                  <h4 className="font-semibold text-gray-800 mb-2">Insurance Certificate</h4>
                  <p className="text-sm text-gray-600 mb-4">Upload your business insurance certificate (recommended)</p>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => triggerFileInput('insuranceCertificate')}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {sellerForm.insuranceCertificate ? sellerForm.insuranceCertificate.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 5MB</p>
                  </div>
                  <input
                    id="insuranceCertificate"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileInputChange(e, 'insuranceCertificate')}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Membership Plan</h2>
              <p className="text-gray-600">Select the plan that best fits your business needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {membershipPlans.map(plan => (
                <div
                  key={plan.id}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    sellerForm.membershipPlan === plan.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${plan.recommended ? 'relative' : ''}`}
                  onClick={() => setSellerForm(prev => ({ ...prev, membershipPlan: plan.id }))}
                >
                  {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Recommended
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                    <div className="text-3xl font-bold text-green-600 mt-2">
                      {plan.price}
                      <span className="text-lg text-gray-500">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <div className={`w-4 h-4 rounded-full border-2 mx-auto ${
                      sellerForm.membershipPlan === plan.id
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {sellerForm.membershipPlan === plan.id && (
                        <Check className="w-3 h-3 text-white m-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-gray-200 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Terms & Verification</h3>

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={sellerForm.agreeToTerms}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                </span>
              </label>

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="agreeToVerification"
                  checked={sellerForm.agreeToVerification}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  I consent to business verification checks and understand that my application will be reviewed before approval
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xl">
              PartsFinda
            </div>
            <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-semibold">
              Jamaica
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Become a Verified Supplier</h1>
          <p className="text-lg text-gray-600">Join Jamaica's premier car parts marketplace</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-16 mx-2 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {steps.map(step => (
              <div key={step.number} className="text-center">
                <p className={`text-xs font-medium ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {renderStepContent()}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}
            </div>

            <div>
              {currentStep < 6 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit Application
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}