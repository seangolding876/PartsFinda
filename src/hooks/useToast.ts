// hooks/useToast.ts
'use client';

import { useCallback } from 'react';

type AlertType = 'successmsg' | 'errormsg' | 'warningmsg' | 'infomsg';

export const useToast = () => {
  const showToast = useCallback((message: string, type: AlertType = 'infomsg') => {
    if (typeof window !== 'undefined' && (window as any).showAlert) {
      (window as any).showAlert(message, type);
    } else {
      console.log('Custom alert function not available');
      // Fallback to native alert
      if (type === 'errormsg') {
        alert(`❌ ${message}`);
      } else if (type === 'warningmsg') {
        alert(`⚠️ ${message}`);
      } else if (type === 'successmsg') {
        alert(`✅ ${message}`);
      } else {
        alert(`ℹ️ ${message}`);
      }
    }
  }, []);

  // Convenience methods
  const successmsg = useCallback((message: string) => showToast(message, 'successmsg'), [showToast]);
  const errormsg = useCallback((message: string) => showToast(message, 'errormsg'), [showToast]);
  const warningmsg = useCallback((message: string) => showToast(message, 'warningmsg'), [showToast]);
  const infomsg = useCallback((message: string) => showToast(message, 'infomsg'), [showToast]);

  return {
    showToast,
    successmsg,
    errormsg,
    warningmsg,
    infomsg,
  };
};