// contexts/AlertContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface Alert {
  id: string;
  message: string;
  type: AlertType;
  duration?: number;
}

interface AlertContextType {
  alerts: Alert[];
  showAlert: (message: string, type?: AlertType, duration?: number) => void;
  hideAlert: (id: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const showAlert = (message: string, type: AlertType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newAlert: Alert = { id, message, type, duration };
    
    setAlerts(prev => [...prev, newAlert]);

    // Auto hide after duration
    if (duration > 0) {
      setTimeout(() => {
        hideAlert(id);
      }, duration);
    }
  };

  const hideAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <AlertContext.Provider value={{ alerts, showAlert, hideAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};