// hooks/useToast.ts
'use client';

import { useCallback } from 'react';

type AlertType = 'successmsg' | 'errormsg' | 'warningmsg' | 'infomsg';

export const useToast = () => {
  const showToast = useCallback((message: string, type: AlertType = 'infomsg', duration = 10000) => {
    if (typeof window !== 'undefined' && (window as any).showAlert) {
      (window as any).showAlert(message, type, duration);
    } else {
      console.log('Custom alert function not available');
      
      // SIMPLE ONE-LINE ALERT (NO ICON)
      alert(message);
    }
  }, []);

  const successmsg = useCallback((message: string, duration = 10000) => 
    showToast(message, 'successmsg', duration), [showToast]);
  
  const errormsg = useCallback((message: string, duration = 10000) => 
    showToast(message, 'errormsg', duration), [showToast]);
  
  const warningmsg = useCallback((message: string, duration = 10000) => 
    showToast(message, 'warningmsg', duration), [showToast]);
  
  const infomsg = useCallback((message: string, duration = 10000) => 
    showToast(message, 'infomsg', duration), [showToast]);

  return {
    showToast,
    successmsg,
    errormsg,
    warningmsg,
    infomsg,
  };
};
