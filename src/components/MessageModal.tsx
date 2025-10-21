// components/MessageModal.tsx (Updated)
'use client';

import { useState } from 'react';
import { X, Send, Mail } from 'lucide-react';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: {
    id: string;
    businessName: string;
    email: string;
    ownerName: string;
  } | null;
}

export default function MessageModal({ isOpen, onClose, supplier }: MessageModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  if (!isOpen || !supplier) return null;

// components/MessageModal.tsx - Updated handleSendMessage function
const handleSendMessage = async () => {
  if (!message.trim()) {
    alert('Please enter a message');
    return;
  }

  try {
    setLoading(true);

    // Get auth data
    const getAuthData = () => {
      if (typeof window === 'undefined') return null;
      try {
        const authData = localStorage.getItem('authData');
        return authData ? JSON.parse(authData) : null;
      } catch (error) {
        return null;
      }
    };

    const authData = getAuthData();
    if (!authData?.token) {
      alert('Authentication required');
      return;
    }

    // Step 1: First try to get existing conversations
    let conversationId = null;
    
    try {
      const conversationsResponse = await fetch('/api/conversations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });

      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        // Find existing conversation with this supplier
        const existingConv = conversationsData.data?.find((conv: any) => 
          conv.participant?.id === supplier.id
        );
        if (existingConv) {
          conversationId = existingConv.id;
        }
      }
    } catch (convError) {
      console.log('No existing conversations found, will create new one');
    }

    // Step 2: If no existing conversation, create one using messages API
    if (!conversationId) {
      // Use messages/send API as fallback
      const createResponse = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          receiverId: supplier.id,
          partRequestId: null,
          messageText: message.trim()
        })
      });

      if (createResponse.ok) {
        const createResult = await createResponse.json();
        conversationId = createResult.conversationId;
      } else {
        throw new Error('Failed to create conversation');
      }
    }

    // Step 3: If we have conversationId but need to send message separately
    if (conversationId) {
      // Send message to the conversation
      const messageResponse = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          messageText: message.trim()
        })
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to send message');
      }
    }

    // Step 4: Send email if requested
    if (sendEmail) {
      try {
        const emailTemplate = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Message from PartsFinda Admin</h2>
            <p>Dear ${supplier.ownerName},</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0; font-style: italic;">"${message.trim()}"</p>
            </div>
            <p>This message was sent to you by the PartsFinda Admin team.</p>
            <p>You can reply to this message by logging into your seller dashboard.</p>
            <br />
            <p>Best regards,<br/>PartsFinda Team</p>
          </div>
        `;

        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: supplier.email,
            subject: `Message from PartsFinda Admin - ${supplier.businessName}`,
            template: emailTemplate
          })
        });

        if (!emailResponse.ok) {
          console.warn('Email sending failed, but message was sent');
        }
      } catch (emailError) {
        console.warn('Email sending error:', emailError);
      }
    }

    alert('Message sent successfully!');
    setMessage('');
    onClose();

    // Open messages page if we have conversationId
    if (conversationId) {
      window.open(`/admin/messages?conversation=${conversationId}`, '_blank');
    }

  } catch (error: any) {
    console.error('Error sending message:', error);
    alert(error.message || 'Failed to send message. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Send Message</h2>
            <p className="text-sm text-gray-600">To: {supplier.businessName}</p>
            <p className="text-xs text-gray-500">{supplier.email}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Input */}
        <div className="p-4">
          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Your Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
          </div>

          {/* Email Option */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="sendEmail" className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="w-4 h-4" />
              Also send as email to supplier
            </label>
          </div>

          {/* Character Count */}
          <div className="text-xs text-gray-500 mb-4">
            {message.length}/1000 characters
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSendMessage}
            disabled={loading || !message.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}