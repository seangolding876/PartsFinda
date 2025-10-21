// components/ApplicationDetailsModal.tsx
'use client';

import { useState } from 'react';
import { X, Mail, Phone, MapPin, Calendar, Download, CheckCircle, XCircle, Building, User, Briefcase, Award } from 'lucide-react';

interface Application {
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
  dateSubmitted: string;
  documentsUploaded: string[];
  status: string;
  urgency: string;
  revenue: string;
  businessLicense?: string;
  taxCertificate?: string;
  insuranceCertificate?: string;
}

interface ApplicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
}

export default function ApplicationDetailsModal({ isOpen, onClose, application }: ApplicationDetailsModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !application) return null;

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
      alert('Document not available');
      return;
    }

    try {
      setLoading(true);
      window.open(documentUrl, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAllDocuments = async () => {
    const documents = [
      { type: 'business_license', url: application.businessLicense },
      { type: 'tax_certificate', url: application.taxCertificate },
      { type: 'insurance', url: application.insuranceCertificate }
    ].filter(doc => doc.url);

    if (documents.length === 0) {
      alert('No documents available for download');
      return;
    }

    try {
      setLoading(true);
      // Download each document
      for (const doc of documents) {
        if (doc.url) {
          window.open(doc.url, '_blank');
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Error downloading documents:', error);
      alert('Failed to download some documents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{application.businessName}</h2>
            <p className="text-gray-600">Application Details</p>
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Business Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Business Name</p>
                  <p className="font-medium">{application.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Owner Name</p>
                  <p className="font-medium">{application.ownerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Type</p>
                  <p className="font-medium capitalize">{application.businessType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Years in Business</p>
                  <p className="font-medium">{application.yearsInBusiness} years</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{application.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{application.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{application.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">
                    Applied on {new Date(application.dateSubmitted).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Documents & Verification
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Business License</h4>
                  {getDocumentStatus(application.documentsUploaded.includes('business_license'))}
                </div>
                {application.businessLicense && (
                  <button
                    onClick={() => handleDownloadDocument('business_license', application.businessLicense)}
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
                  {getDocumentStatus(application.documentsUploaded.includes('tax_certificate'))}
                </div>
                {application.taxCertificate && (
                  <button
                    onClick={() => handleDownloadDocument('tax_certificate', application.taxCertificate)}
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
                  {getDocumentStatus(application.documentsUploaded.includes('insurance'))}
                </div>
                {application.insuranceCertificate && (
                  <button
                    onClick={() => handleDownloadDocument('insurance', application.insuranceCertificate)}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>
            </div>

            {/* Download All Button */}
            <div className="mt-4">
              <button
                onClick={handleDownloadAllDocuments}
                disabled={loading || application.documentsUploaded.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Download All Documents ({application.documentsUploaded.length})
              </button>
            </div>
          </div>

          {/* Specializations */}
          {application.specializations && application.specializations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Specializations
              </h3>
              <div className="flex flex-wrap gap-2">
                {application.specializations.map((spec, index) => (
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

          {/* Application Status */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-gray-800 mb-2 capitalize">
                {application.membershipPlan}
              </div>
              <p className="text-sm text-gray-600">Membership Plan</p>
              <p className="text-xs text-gray-500 capitalize">{application.revenue}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-gray-800 mb-2">
                {application.status === 'verified' ? 'Verified' : application.status.replace('_', ' ')}
              </div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-xs text-gray-500 capitalize">
                {application.status === 'verified' ? 'All documents verified' : 'Under review'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-gray-800 mb-2 capitalize">
                {application.urgency}
              </div>
              <p className="text-sm text-gray-600">Priority</p>
              <p className="text-xs text-gray-500">
                {application.urgency === 'urgent' ? 'Requires immediate attention' : 'Normal priority'}
              </p>
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
        </div>
      </div>
    </div>
  );
}