'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Check, Upload, Building, MapPin, Phone, Mail, User, FileText, 
  CreditCard, Star, Shield, CheckCircle, AlertCircle, ArrowRight,
  Briefcase, Store, Award, Clock, Globe, Calendar, Wrench,
  Layers, Package, Truck, BadgeCheck, Sparkles, Crown,
  TrendingUp, Users, ShoppingBag, Zap, Heart, MessageCircle,
  DollarSign, Target, BarChart3, PhoneCall, MailOpen, Headphones
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function SellerSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { successmsg, errormsg, infomsg } = useToast();

  const [sellerForm, setSellerForm] = useState({
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: 'auto_parts_shop',
    businessRegistrationNumber: '',
    taxId: '',
    yearsInBusiness: '',
    address: '',
    parish: '',
    city: '',
    postalCode: '',
    businessPhone: '',
    businessEmail: '',
    website: '',
    specializations: [],
    vehicleBrands: [],
    partCategories: [],
    businessLicense: null as File | null,
    taxCertificate: null as File | null,
    insuranceCertificate: null as File | null,
    membershipPlan: 'basic',
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
    { value: 'auto_parts_shop', label: 'Auto Parts Shop', icon: <Store className="w-4 h-4" /> },
    { value: 'mechanic_shop', label: 'Mechanic Shop', icon: <Wrench className="w-4 h-4" /> },
    { value: 'dealer', label: 'Vehicle Dealer', icon: <Truck className="w-4 h-4" /> },
    { value: 'distributor', label: 'Parts Distributor', icon: <Package className="w-4 h-4" /> },
    { value: 'manufacturer', label: 'Parts Manufacturer', icon: <Layers className="w-4 h-4" /> },
    { value: 'individual', label: 'Individual Seller', icon: <User className="w-4 h-4" /> }
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
      recommended: false,
      icon: <Briefcase className="w-6 h-6" />
    },
    {
      id: 'premium',
      name: 'Premium', 
      price: 'J$2,500',
      period: '/month',
      features: ['Priority listing', 'Instant notifications', 'Advanced analytics', 'Customer support'],
      recommended: true,
      icon: <Crown className="w-6 h-6" />
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'J$5,000', 
      period: '/month',
      features: ['Top placement', 'Featured supplier badge', 'Bulk messaging', 'Dedicated account manager'],
      recommended: false,
      icon: <Award className="w-6 h-6" />
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
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        infomsg('File size must be less than 5MB. Please choose a smaller file.');
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        infomsg('Only PDF, JPG, and PNG files are allowed.');
        return;
      }
    }

    setSellerForm(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const triggerFileInput = (inputId: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = event.target.files?.[0] || null;
    handleFileChange(field, file);
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
        return true;
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
      const uploadFile = async (file: File | null, type: string): Promise<string | null> => {
        if (!file) return null;

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('type', type);
        uploadFormData.append('sellerEmail', sellerForm.email);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Failed to upload ${type}`);
        }

        return result.fileUrl;
      };

      const uploadPromises = [
        uploadFile(sellerForm.businessLicense, 'business_license'),
        uploadFile(sellerForm.taxCertificate, 'tax_certificate'),
        uploadFile(sellerForm.insuranceCertificate, 'insurance_certificate'),
      ];

      const [businessLicenseUrl, taxCertificateUrl, insuranceCertificateUrl] = await Promise.all(uploadPromises);

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
        businessLicense: businessLicenseUrl,
        taxCertificate: taxCertificateUrl,
        insuranceCertificate: insuranceCertificateUrl,
        membershipPlan: sellerForm.membershipPlan,
        agreeToTerms: sellerForm.agreeToTerms,
        agreeToVerification: sellerForm.agreeToVerification
      };

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

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Personal Information</h2>
              <p className="text-gray-600">Tell us about yourself as the business owner</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5 transition-colors" />
                  <input
                    type="text"
                    name="ownerName"
                    value={sellerForm.ownerName}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={sellerForm.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5 transition-colors" />
                  <input
                    type="tel"
                    name="phone"
                    value={sellerForm.phone}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="+876 XXX XXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5 transition-colors" />
                  <input
                    type="password"
                    name="password"
                    value={sellerForm.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Check className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5 transition-colors" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={sellerForm.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="Repeat your password"
                  />
                </div>
                {sellerForm.password && sellerForm.confirmPassword && sellerForm.password !== sellerForm.confirmPassword && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full mb-4">
                <Building className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Business Information</h2>
              <p className="text-gray-600">Details about your auto parts business</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 w-5 h-5 transition-colors" />
                  <input
                    type="text"
                    name="businessName"
                    value={sellerForm.businessName}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="Kingston Auto Parts Ltd."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="businessType"
                  value={sellerForm.businessType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white appearance-none"
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years in Business <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 w-5 h-5 transition-colors" />
                  <select
                    name="yearsInBusiness"
                    value={sellerForm.yearsInBusiness}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white appearance-none"
                  >
                    <option value="">Select years</option>
                    <option value="0-1">Less than 1 year</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">More than 10 years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Registration Number
                </label>
                <div className="relative group">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 w-5 h-5 transition-colors" />
                  <input
                    type="text"
                    name="businessRegistrationNumber"
                    value={sellerForm.businessRegistrationNumber}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="Company registration number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax ID / TRN
                </label>
                <div className="relative group">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 w-5 h-5 transition-colors" />
                  <input
                    type="text"
                    name="taxId"
                    value={sellerForm.taxId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="Tax Registration Number"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full mb-4">
                <MapPin className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Location & Contact</h2>
              <p className="text-gray-600">Where can customers find your business?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 w-5 h-5 transition-colors" />
                  <input
                    type="text"
                    name="address"
                    value={sellerForm.address}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="123 Main Street"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parish <span className="text-red-500">*</span>
                </label>
                <select
                  name="parish"
                  value={sellerForm.parish}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white appearance-none"
                >
                  <option value="">Select Parish</option>
                  {jamaicaParishes.map(parish => (
                    <option key={parish} value={parish}>{parish}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City/Town <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 w-5 h-5 transition-colors" />
                  <input
                    type="text"
                    name="city"
                    value={sellerForm.city}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="Kingston"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 w-5 h-5 transition-colors" />
                  <input
                    type="tel"
                    name="businessPhone"
                    value={sellerForm.businessPhone}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="+876 XXX XXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 w-5 h-5 transition-colors" />
                  <input
                    type="email"
                    name="businessEmail"
                    value={sellerForm.businessEmail}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="info@business.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <div className="relative group">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 w-5 h-5 transition-colors" />
                  <input
                    type="url"
                    name="website"
                    value={sellerForm.website}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="https://www.business.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={sellerForm.postalCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full mb-4">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Specializations</h2>
              <p className="text-gray-600">What types of parts and vehicles do you specialize in?</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  Part Categories <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-600 mb-4">Select all categories that apply to your business</p>
                <div className="grid md:grid-cols-3 gap-3">
                  {specializationOptions.map(spec => (
                    <label key={spec} className={`flex items-center space-x-3 p-3.5 border-2 rounded-xl hover:shadow-md cursor-pointer transition-all ${
                      sellerForm.specializations.includes(spec) 
                        ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={sellerForm.specializations.includes(spec)}
                        onChange={() => handleMultiSelect('specializations', spec)}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-purple-600" />
                  Vehicle Brands
                </h3>
                <p className="text-sm text-gray-600 mb-4">Which vehicle brands do you have parts for?</p>
                <div className="grid md:grid-cols-4 gap-3">
                  {vehicleBrandOptions.map(brand => (
                    <label key={brand} className={`flex items-center space-x-3 p-3.5 border-2 rounded-xl hover:shadow-md cursor-pointer transition-all ${
                      sellerForm.vehicleBrands.includes(brand) 
                        ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100' 
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={sellerForm.vehicleBrands.includes(brand)}
                        onChange={() => handleMultiSelect('vehicleBrands', brand)}
                        className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-full mb-4">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Business Documents</h2>
              <p className="text-gray-600">Upload your business verification documents (optional but recommended)</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Why verify your business? (Optional)
              </h3>
              <ul className="grid md:grid-cols-2 gap-3">
                <li className="flex items-center gap-2 text-sm text-gray-700 p-2 bg-white rounded-lg">
                  <BadgeCheck className="w-4 h-4 text-green-500" />
                  Get verified badge to build customer trust
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700 p-2 bg-white rounded-lg">
                  <Award className="w-4 h-4 text-green-500" />
                  Higher ranking in search results
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700 p-2 bg-white rounded-lg">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  Access to premium features
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700 p-2 bg-white rounded-lg">
                  <Clock className="w-4 h-4 text-green-500" />
                  Faster application approval
                </li>
              </ul>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Business License
                </h4>
                <p className="text-sm text-gray-600 mb-4">Upload your business license or registration certificate (Optional)</p>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                    sellerForm.businessLicense
                      ? 'border-green-400 bg-green-50 hover:border-green-500'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  onClick={() => triggerFileInput('businessLicense')}
                >
                  {sellerForm.businessLicense ? (
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  ) : (
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  )}
                  <p className={`text-sm ${sellerForm.businessLicense ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                    {sellerForm.businessLicense ? `✓ ${sellerForm.businessLicense.name}` : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 5MB</p>
                  {sellerForm.businessLicense && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileChange('businessLicense', null);
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
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

              <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Tax Certificate
                </h4>
                <p className="text-sm text-gray-600 mb-4">Upload your tax compliance certificate (Optional)</p>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                    sellerForm.taxCertificate
                      ? 'border-green-400 bg-green-50 hover:border-green-500'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  onClick={() => triggerFileInput('taxCertificate')}
                >
                  {sellerForm.taxCertificate ? (
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  ) : (
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  )}
                  <p className={`text-sm ${sellerForm.taxCertificate ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                    {sellerForm.taxCertificate ? `✓ ${sellerForm.taxCertificate.name}` : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 5MB</p>
                  {sellerForm.taxCertificate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileChange('taxCertificate', null);
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove file
                    </button>
                  )}
                </div>
                <input
                  id="taxCertificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleFileInputChange(e, 'taxCertificate')}
                />
              </div>

              <div className="md:col-span-2 border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Insurance Certificate
                </h4>
                <p className="text-sm text-gray-600 mb-4">Upload your business insurance certificate (Optional)</p>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                    sellerForm.insuranceCertificate
                      ? 'border-green-400 bg-green-50 hover:border-green-500'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  onClick={() => triggerFileInput('insuranceCertificate')}
                >
                  {sellerForm.insuranceCertificate ? (
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  ) : (
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  )}
                  <p className={`text-sm ${sellerForm.insuranceCertificate ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                    {sellerForm.insuranceCertificate ? `✓ ${sellerForm.insuranceCertificate.name}` : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 5MB</p>
                  {sellerForm.insuranceCertificate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileChange('insuranceCertificate', null);
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove file
                    </button>
                  )}
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
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4">
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Membership Plan</h2>
              <p className="text-gray-600">Select the plan that best fits your business needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {membershipPlans.map(plan => (
                <div
                  key={plan.id}
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all transform hover:-translate-y-1 ${
                    sellerForm.membershipPlan === plan.id
                      ? 'border-blue-500 bg-gradient-to-b from-blue-50 to-white shadow-xl shadow-blue-100'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                  } ${plan.recommended ? 'pt-8' : ''}`}
                  onClick={() => setSellerForm(prev => ({ ...prev, membershipPlan: plan.id }))}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                        <Sparkles className="w-3 h-3" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      plan.id === sellerForm.membershipPlan 
                        ? 'bg-blue-100' 
                        : 'bg-gray-100'
                    }`}>
                      {plan.icon}
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                    <div className="text-3xl font-bold text-blue-600 mt-2">
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

                  <div className="mt-6 flex justify-center">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      sellerForm.membershipPlan === plan.id
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {sellerForm.membershipPlan === plan.id && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-6 space-y-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Terms & Verification
              </h3>

              <label className="flex items-start space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={sellerForm.agreeToTerms}
                  onChange={handleChange}
                  className="mt-0.5 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  I agree to the <Link href="/terms" className="text-blue-600 hover:underline font-medium">Terms of Service</Link> and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline font-medium">Privacy Policy</Link>
                </span>
              </label>

              <label className="flex items-start space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                <input
                  type="checkbox"
                  name="agreeToVerification"
                  checked={sellerForm.agreeToVerification}
                  onChange={handleChange}
                  className="mt-0.5 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ==================== INFORMATION SECTION (BEFORE FORM) ==================== */}
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full filter blur-3xl"></div>
        </div>
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Join 500+ Verified Suppliers
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Grow Your Auto Parts<br />
            <span className="text-yellow-300">Business in Jamaica</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Connect with thousands of buyers across Jamaica. Get verified, list your parts, 
            and start selling today.
          </p>
          {/* <button
            onClick={() => setShowForm(true)}
            className="bg-white text-blue-700 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105 inline-flex items-center gap-3"
          >
            <User className="w-5 h-5" />
            Start Your Application
            <ArrowRight className="w-5 h-5" />
          </button> */}
        </div>
      </section>

      {/* Stats Section */}
      {/* <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Active Suppliers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">10K+</div>
              <div className="text-gray-600">Parts Listed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">2K+</div>
              <div className="text-gray-600">Monthly Buyers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">95%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Why Become a Supplier?</h2>
            <p className="text-lg text-gray-600">Get access to exclusive benefits and grow your business</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Reach More Customers</h3>
              <p className="text-gray-600">Connect with thousands of auto parts buyers across Jamaica actively looking for parts.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Grow Your Business</h3>
              <p className="text-gray-600">Increase sales with our targeted marketing and analytics tools to track performance.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Build Trust</h3>
              <p className="text-gray-600">Get verified and earn a trusted badge to stand out from competitors and build credibility.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Choose Your Membership Plan</h2>
            <p className="text-lg text-gray-600">Select the perfect plan for your business needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <div className="border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Briefcase className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Basic</h3>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-800">J$0</span>
                <span className="text-gray-500 text-lg">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Basic listing
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  24-hour response delay
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Email notifications
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Basic analytics
                </li>
              </ul>
              <button 
                onClick={() => setShowForm(true)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-semibold transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Premium Plan - Recommended */}
            <div className="relative border-2 border-blue-500 rounded-2xl p-8 hover:shadow-2xl transition-all transform hover:-translate-y-1 bg-gradient-to-b from-blue-50 to-white">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Crown className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Premium</h3>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-blue-600">J$2,500</span>
                <span className="text-gray-500 text-lg">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-green-500" />
                  Priority listing
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-green-500" />
                  Instant notifications
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-green-500" />
                  Advanced analytics
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-green-500" />
                  Customer support
                </li>
              </ul>
              <button 
                onClick={() => setShowForm(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200"
              >
                Get Started
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Enterprise</h3>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-800">J$5,000</span>
                <span className="text-gray-500 text-lg">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Top placement
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Featured supplier badge
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Bulk messaging
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  Dedicated account manager
                </li>
              </ul>
              <button 
                onClick={() => setShowForm(true)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-semibold transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">What Our Suppliers Say</h2>
            <p className="text-lg text-gray-600">Hear from successful auto parts sellers in Jamaica</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                  MK
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Mark King</h4>
                  <p className="text-sm text-gray-600">Kingston Auto Parts</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-3">★★★★★</div>
              <p className="text-gray-600">"PartsFinda has transformed our business. We've seen a 200% increase in leads since joining."</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xl">
                  SJ
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Sarah Johnson</h4>
                  <p className="text-sm text-gray-600">Mobay Mechanics</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-3">★★★★★</div>
              <p className="text-gray-600">"The verified badge helped us build trust with new customers instantly."</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xl">
                  DW
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">David Williams</h4>
                  <p className="text-sm text-gray-600">Williams Auto Parts</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-3">★★★★★</div>
              <p className="text-gray-600">"Premium membership gave us priority listing and our sales doubled within a month."</p>
            </div>
          </div>
        </div>
      </section> */}

      {/* FAQ Section */}
      {/* <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Everything you need to know about becoming a supplier</p>
          </div>
          <div className="space-y-4">
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-all">
              <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                How long does verification take?
              </h3>
              <p className="text-gray-600">Typically 1-2 business days. We'll notify you via email once approved.</p>
            </div>
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-all">
              <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Can I change my membership plan later?
              </h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time from your dashboard.</p>
            </div>
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-all">
              <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                What documents do I need to provide?
              </h3>
              <p className="text-gray-600">Business license, tax certificate, and insurance certificate (recommended for verification).</p>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Grow Your Auto Parts Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join Jamaica's premier car parts marketplace and connect with thousands of buyers
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-blue-700 px-8 py-4 rounded-xl text-lg font-bold hover:shadow-2xl transition-all transform hover:scale-105 inline-flex items-center gap-2"
          >
            <User className="w-5 h-5" />
            Become a Verified Supplier
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ==================== FORM SECTION (AFTER INFORMATION) ==================== */}
      
      {showForm && (
        <div className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            {/* Back Button */}
            <button
              onClick={() => setShowForm(false)}
              className="mb-6 text-gray-600 hover:text-blue-600 flex items-center gap-2 transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Information
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl font-bold text-2xl shadow-lg">
                  PartsFinda
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-3 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Jamaica
                </div>
              </Link>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Complete Your Registration</h1>
              <p className="text-gray-600">Fill in the details below to become a verified supplier</p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8 bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4 px-4">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'border-gray-300 text-gray-400 bg-white'
                    } ${currentStep === step.number ? 'ring-4 ring-blue-200' : ''}`}>
                      {currentStep > step.number ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-1 w-16 mx-2 transition-all duration-300 ${
                        currentStep > step.number ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between px-2">
                {steps.map(step => (
                  <div key={step.number} className="text-center">
                    <p className={`text-xs font-medium transition-colors duration-300 ${
                      currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              {renderStepContent()}

              {error && (
                <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gray-200">
                <div>
                  {currentStep > 1 && (
                    <button
                      onClick={prevStep}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium flex items-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Previous
                    </button>
                  )}
                </div>

                <div>
                  {currentStep < 6 ? (
                    <button
                      onClick={nextStep}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all font-medium flex items-center gap-2"
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-200 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
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
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

// Missing component for FAQ
function HelpCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// Missing component for Home
function Home(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1" />
    </svg>
  );
}