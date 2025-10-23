// contexts/ToastContext.tsx
'use client';
import { createContext, useContext, ReactNode } from 'react';
import { toast, ToastOptions, ToastType } from 'react-hot-toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => string;
}

interface ToastProviderProps {
  children: ReactNode;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const showToast = (message: string, type: ToastType = 'success', options: ToastOptions = {}): string => {
    const config: ToastOptions = {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#363636',
        color: '#fff',
        fontSize: '14px',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      ...options,
    };

    switch (type) {
      case 'success':
        return toast.success(message, config);
      case 'error':
        return toast.error(message, {
          ...config,
          style: {
            ...config.style,
            background: '#dc2626',
          }
        });
      case 'loading':
        return toast.loading(message, config);
      case 'custom':
        return toast.custom(message, config);
      default:
        return toast(message, config);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
};