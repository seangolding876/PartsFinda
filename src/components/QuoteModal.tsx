'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quoteData: any) => Promise<void>;
  request: any;
  loading: boolean;
}

export default function QuoteModal({ isOpen, onClose, onSubmit, request, loading }: QuoteModalProps) {
  const [formData, setFormData] = useState({
    price: '',
    availability: 'in_stock',
    deliveryTime: '1-2 business days',
    condition: 'new',
    warranty: '30 days',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      requestId: request.id,
      price: parseFloat(formData.price),
      availability: formData.availability,
      deliveryTime: formData.deliveryTime,
      condition: formData.condition,
      warranty: formData.warranty,
      notes: formData.notes
    });
    
    if (!loading) {
      setFormData({
        price: '',
        availability: 'in_stock',
        deliveryTime: '1-2 business days',
        condition: 'new',
        warranty: '30 days',
        notes: ''
      });
    }
  };

  if (!isOpen) return null;

  return (
    
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Submit Quote</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Part Request
            </label>
            <p className="text-gray-900 font-semibold">{request.partName}</p>
            <p className="text-sm text-gray-600">
              {request.makeName} {request.modelName} {request.vehicleYear}
            </p>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Your Price (JMD) *
            </label>
            <input
              type="number"
              id="price"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your price"
            />
            <p className="text-xs text-gray-500 mt-1">Buyer's budget: ${request.budget}</p>
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
              Part Condition *
            </label>
            <select
              id="condition"
              required
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
              <option value="oem">OEM</option>
              <option value="aftermarket">Aftermarket</option>
            </select>
          </div>

          <div>
            <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
              Availability *
            </label>
            <select
              id="availability"
              required
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="in_stock">In Stock</option>
              <option value="available_soon">Available Soon</option>
              <option value="need_to_order">Need to Order</option>
            </select>
          </div>

          <div>
            <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Time *
            </label>
            <select
              id="deliveryTime"
              required
              value={formData.deliveryTime}
              onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1-2 business days">1-2 Business Days</option>
              <option value="3-5 business days">3-5 Business Days</option>
              <option value="1 week">1 Week</option>
              <option value="2 weeks">2 Weeks</option>
              <option value="more than 2 weeks">More than 2 weeks</option>
            </select>
          </div>

          <div>
            <label htmlFor="warranty" className="block text-sm font-medium text-gray-700 mb-1">
              Warranty Offered
            </label>
            <select
              id="warranty"
              value={formData.warranty}
              onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="no warranty">No Warranty</option>
              <option value="30 days">30 Days</option>
              <option value="3 months">3 Months</option>
              <option value="6 months">6 Months</option>
              <option value="1 year">1 Year</option>
              <option value="2 years">2 Years</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any additional information about the part, condition, or terms..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.price}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                'Submit Quote'
              )}
            </button>
          </div>
        </form>
      </div>

      
    </div>

    
  );
}