// hooks/useAlert.ts
import { useToast } from '@/context/ToastContext';
import { ToastOptions } from 'react-hot-toast';

interface AlertHookReturn {
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  loading: (message: string, options?: ToastOptions) => string;
  show: (message: string, type?: string, options?: ToastOptions) => string;
}

export const useAlert = (): AlertHookReturn => {
  const { showToast } = useToast();

  const success = (message: string, options: ToastOptions = {}): string => 
    showToast(message, 'success', options);

  const error = (message: string, options: ToastOptions = {}): string => 
    showToast(message, 'error', options);

  const info = (message: string, options: ToastOptions = {}): string => 
    showToast(message, 'custom', {
      ...options,
      style: {
        background: '#3b82f6',
        color: '#fff',
      }
    });

  const warning = (message: string, options: ToastOptions = {}): string => 
    showToast(message, 'custom', {
      ...options,
      style: {
        background: '#f59e0b',
        color: '#fff',
      }
    });

  const loading = (message: string, options: ToastOptions = {}): string => 
    showToast(message, 'loading', options);

  return {
    success,
    error,
    info,
    warning,
    loading,
    show: showToast,
  };
};