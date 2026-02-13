import { useState, useCallback } from 'react';
import type { SmsResponse } from '@/types/twilio.types';

interface UseSmsReturn {
  sendSms: (to: string, message: string) => Promise<SmsResponse>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export const useSms = (): UseSmsReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  const sendSms = useCallback(async (to: string, message: string): Promise<SmsResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ to, message })
      });
      
      const data = await response.json() as SmsResponse;
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
      }
      
      return data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send SMS';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendSms, loading, error, reset };
};