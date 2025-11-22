// components/ViewProfileModal.tsx (Updated)
'use client';

import { useState } from 'react';
import { X, Mail, Phone, MapPin, Calendar, Star, Download, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast'; 

interface SupplierProfile {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  location: string;
  businessType: string;
  yearsInBusiness: string;
  specializations: string[];
  membershipPlan: string;
  dateJoined: string;
  rating: string;
  reviews: number;
  revenue: string;
  status: string;
  businessLicense?: string;
  taxCertificate?: string;
  insuranceCertificate?: string;
  documents: {
    businessLicense: boolean;
    taxCertificate: boolean;
    insurance: boolean;
  };
  totalQuotes?: number;
  lastActive?: string;
}

interface ViewProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierProfile | null;
  onSendMessage?: (supplier: SupplierProfile) => void;
}

export default function ViewProfileModal({ isOpen, onClose, supplier, onSendMessage }: ViewProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const { successmsg, errormsg, infomsg } = useToast(); 

  if (!isOpen || !supplier) return null;

  const getDocumentStatus = (hasDocument: boolean) => {
    return hasDocument ? (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">Uploaded</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-red-600">
        <XCircle className="w-4 h-4" />
        <span className="text-sm">Missing</span>
      </div>
    );
  };

  const handleDownloadDocument = async (documentType: string, documentUrl?: string) => {
    if (!documentUrl) {
      infomsg('Document not available');
      return;
    }

    try {
      setLoading(true);
      window.open(documentUrl, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      errormsg('Failed to download document');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (onSendMessage) {
      onSendMessage(supplier);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{supplier.businessName}</h2>
            <p className="text-gray-600">Supplier Profile Details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Business Name</p>
                  <p className="font-medium">{supplier.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Owner Name</p>
                  <p className="font-medium">{supplier.ownerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Type</p>
                  <p className="font-medium capitalize">{supplier.businessType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Years in Business</p>
                  <p className="font-medium">{supplier.yearsInBusiness} years</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{supplier.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{supplier.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{supplier.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">
                    Member since {new Date(supplier.dateJoined).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents & Verification</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Business License</h4>
                  {getDocumentStatus(supplier.documents.businessLicense)}
                </div>
                {supplier.businessLicense && (
                  <button
                    onClick={() => handleDownloadDocument('business_license', supplier.businessLicense)}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Tax Certificate</h4>
                  {getDocumentStatus(supplier.documents.taxCertificate)}
                </div>
                {supplier.taxCertificate && (
                  <button
                    onClick={() => handleDownloadDocument('tax_certificate', supplier.taxCertificate)}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Insurance Certificate</h4>
                  {getDocumentStatus(supplier.documents.insurance)}
                </div>
                {supplier.insuranceCertificate && (
                  <button
                    onClick={() => handleDownloadDocument('insurance', supplier.insuranceCertificate)}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Specializations */}
          {supplier.specializations && supplier.specializations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {supplier.specializations.map((spec, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-xl font-bold text-gray-800">{supplier.rating}</span>
              </div>
              <p className="text-sm text-gray-600">Rating</p>
              <p className="text-xs text-gray-500">({supplier.reviews} reviews)</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-gray-800 mb-2 capitalize">
                {supplier.membershipPlan}
              </div>
              <p className="text-sm text-gray-600">Membership Plan</p>
              <p className="text-xs text-gray-500 capitalize">{supplier.revenue}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-gray-800 mb-2">
                {supplier.status === 'verified' ? 'Verified' : 'Pending'}
              </div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-xs text-gray-500">
                {supplier.status === 'verified' ? 'All documents verified' : 'Under review'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-gray-800 mb-2">
                {supplier.totalQuotes || 0}
              </div>
              <p className="text-sm text-gray-600">Quotes Submitted</p>
              <p className="text-xs text-gray-500">Total quotes</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}