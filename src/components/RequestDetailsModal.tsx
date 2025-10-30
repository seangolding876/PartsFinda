'use client';

import { X, MapPin, Calendar, Clock, User, Phone, Mail, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/useToast'; // ✅ Toast hook import

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
}

export default function RequestDetailsModal({ isOpen, onClose, request }: RequestDetailsModalProps) {
  // ✅ Toast hook use karein
  const { infomsg } = useToast();

  if (!isOpen || !request) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-JM', {
      style: 'currency',
      currency: 'JMD'
    }).format(amount);
  };

  // Copy to clipboard function with toast
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    infomsg(`${type} copied to clipboard`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Request Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Part Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Part Information</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
                <p className="text-gray-900">{request.partName}</p>
              </div>
              {request.partNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                  <p className="text-gray-900">{request.partNumber}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <p className="text-gray-900">{request.makeName} {request.modelName} {request.vehicleYear}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition Preferred</label>
                <p className="text-gray-900 capitalize">{request.condition}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{request.description}</p>
          </div>

          {/* Buyer Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Buyer Information</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => copyToClipboard(request.buyerName, 'Buyer name')}
              >
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="text-gray-900 font-medium">{request.buyerName}</p>
                </div>
              </div>
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => copyToClipboard(request.buyerEmail, 'Email')}
              >
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900 font-medium">{request.buyerEmail}</p>
                </div>
              </div>
              {request.buyerPhone && (
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => copyToClipboard(request.buyerPhone, 'Phone number')}
                >
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-gray-900 font-medium">{request.buyerPhone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-gray-900 font-medium">{request.parish}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Request Details</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Budget</p>
                  <p className="text-green-600 font-bold text-lg">{formatCurrency(request.budget)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Urgency</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    request.urgency === 'high' ? 'bg-red-100 text-red-800' :
                    request.urgency === 'medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {request.urgency}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Expires</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(request.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Quotes Received</p>
                <p className="text-blue-600 font-bold text-lg">{request.totalQuotes}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}