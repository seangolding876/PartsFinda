// hooks/useWelcomeMessage.ts
'use client';

import { useEffect } from 'react';
import { useToast } from './useToast';
import { getAuthData } from '@/lib/auth';

export const useWelcomeMessage = () => {
  const { successmsg } = useToast();

  useEffect(() => {
    const authData = getAuthData();
    
    if (authData) {
      // ✅ User-specific + role-specific key
      const welcomeKey = `hasSeenWelcome_${authData.role}_${authData.userId}`;
      const hasSeenWelcome = sessionStorage.getItem(welcomeKey);
      
      if (!hasSeenWelcome) {
        let welcomeMessage = '';
        
        switch (authData.role) {
          case 'seller':
            welcomeMessage = `Welcome back, ${authData.name}! Ready to manage your parts listings?`;
            break;
          case 'admin':
            welcomeMessage = `Welcome back, ${authData.name}! Manage your platform effectively.`;
            break;
          case 'buyer':
          default:
            welcomeMessage = `Welcome back to PartsFinda, ${authData.name}!`;
            break;
        }
        
        successmsg(welcomeMessage);
        sessionStorage.setItem(welcomeKey, 'true');
      }
    }
  }, [successmsg]);
};