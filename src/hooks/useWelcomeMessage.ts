// hooks/useWelcomeMessage.ts
'use client';

import { useEffect } from 'react';
import { useToast } from './useToast';
import { getAuthData } from '@/lib/auth';

export const useWelcomeMessage = () => {
  const { successmsg, warningmsg } = useToast();

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

      // ✅ Seller subscription expiry check
      if (authData.role === 'seller') {
        checkSellerSubscription(authData.userId);
      }
    }
  }, [successmsg, warningmsg]);

  // Seller subscription expiry check function
  const checkSellerSubscription = async (userId: string) => {
    try {
      const response = await fetch(`/api/seller/subscription/status?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.expired) {
          // ✅ Subscription expiry message
          warningmsg(
            `Your ${data.planName} subscription has expired. You've been downgraded to Basic plan. Please update your subscription to access premium features.`,
            8000 // 8 seconds display
          );
        }
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    }
  };
};