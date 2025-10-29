'use client';

import { useState } from 'react';
import { ContactMessage, MessageStatus, MessageType } from '@/types/contact';
import { getAuthToken } from '@/lib/auth';

interface ContactMessageDetailsProps {
  message: ContactMessage;
  onClose: () => void;
  onStatusUpdate: (messageId: string, newStatus: MessageStatus) => void;
  getStatusColor: (status: MessageStatus) => string;
  getTypeColor: (type: MessageType) => string;
}

export default function ContactMessageDetails({
  message,
  onClose,
  onStatusUpdate,
  getStatusColor,
  getTypeColor
}: ContactMessageDetailsProps) {
  const [adminNotes, setAdminNotes] = useState(message.admin_notes || '');
  const token = getAuthToken();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSaveNotes = async () => {
    try {
   
      const response = await fetch('/api/admin/contact-messages', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: message.id,
          adminNotes
        })
      });

      const data = await response.json();
      if (data.success) {
        // Notes saved successfully
        console.log('Notes saved');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Message Details</h3>
            <p className="text-sm text-gray-500 mt-1">ID: {message.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contact Info & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-sm text-gray-900">{message.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <a 
                    href={`mailto:${message.email}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {message.email}
                  </a>
                </div>
                {message.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <a 
                      href={`tel:${message.phone}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {message.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Message Metadata */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Message Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Type:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(message.type)}`}>
                    {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <select
                    value={message.status}
                    onChange={(e) => onStatusUpdate(message.id, e.target.value as MessageStatus)}
                    className={`text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(message.status)}`}
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Submitted</p>
                  <p className="text-sm text-gray-900">{formatDate(message.created_at)}</p>
                </div>
                {message.responded_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Responded</p>
                    <p className="text-sm text-gray-900">{formatDate(message.responded_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <a
                  href={`mailto:${message.email}?subject=Re: ${message.subject}&body=Dear ${message.name},%0D%0A%0D%0A`}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700 text-center block"
                >
                  📧 Reply via Email
                </a>
                {message.phone && (
                  <a
                    href={`tel:${message.phone}`}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-green-700 text-center block"
                  >
                    📞 Call Customer
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Message Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subject */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Subject</h4>
              <p className="text-lg text-gray-900 bg-gray-50 rounded-lg p-4">{message.subject}</p>
            </div>

            {/* Message Content */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Message</h4>
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                {message.message}
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Admin Notes</h4>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this message..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSaveNotes}
                  className="bg-gray-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-gray-700"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
          <button
            onClick={onClose}
            className="bg-white text-gray-700 py-2 px-4 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => onStatusUpdate(message.id, 'resolved')}
            className="bg-green-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-green-700"
          >
            Mark as Resolved
          </button>
        </div>
      </div>
    </div>
  );
}