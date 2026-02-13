'use client';

import React, { createContext, useContext } from 'react';
import { useSms } from '@/hooks/use-sms';
import type { SmsResponse } from '@/types/twilio.types';

interface SmsContextType {
  sendSms: (to: string, message: string) => Promise<SmsResponse>;
  loading: boolean;
  error: string | null;
}

const SmsContext = createContext<SmsContextType | undefined>(undefined);

export const SmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sms = useSms();

  return (
    <SmsContext.Provider value={sms}>
      {children}
    </SmsContext.Provider>
  );
};

export const useSmsContext = () => {
  const context = useContext(SmsContext);
  if (context === undefined) {
    throw new Error('useSmsContext must be used within a SmsProvider');
  }
  return context;
};