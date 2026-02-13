'use client';

import React, { useState } from 'react';
import { useSms } from '@/hooks/use-sms';

interface SmsSenderProps {
  onSuccess?: (messageId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

const SmsSender: React.FC<SmsSenderProps> = ({ 
  onSuccess, 
  onError, 
  className = '' 
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const { sendSms, loading, error, reset } = useSms();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await sendSms(phoneNumber, message);
      if (result.success) {
        onSuccess?.(result.messageId!);
        // Clear form
        setPhoneNumber('');
        setMessage('');
        reset();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send SMS';
      onError?.(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="mb-4">
        <label htmlFor="phone" className="block text-sm font-medium mb-1">
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1234567890"
          required
          disabled={loading}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="message" className="block text-sm font-medium mb-1">
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message..."
          required
          disabled={loading}
          maxLength={1600}
          rows={4}
          className="w-full p-2 border rounded"
        />
        <p className="text-xs text-gray-500 mt-1">
          {message.length}/1600 characters
        </p>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full p-2 text-white rounded ${
          loading 
            ? 'bg-gray-400' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {loading ? 'Sending...' : 'Send SMS'}
      </button>
    </form>
  );
};

export default SmsSender;