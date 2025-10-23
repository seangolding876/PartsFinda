// components/AlertManager.tsx
'use client';

import { useState, useEffect, createContext, useContext } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface Alert {
  id: string;
  message: string;
  type: AlertType;
}

// Simple context without provider
const AlertContext = createContext<{
  showAlert: (message: string, type?: AlertType) => void;
}>({
  showAlert: () => {},
});

export const useAlert = () => useContext(AlertContext);

export default function AlertManager() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const showAlert = (message: string, type: AlertType = 'info') => {
    const id = Date.now().toString();
    const newAlert: Alert = { id, message, type };
    
    console.log('🚀 Showing alert:', message, type); // Debug log
    
    setAlerts(prev => [...prev, newAlert]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 4000);
  };

  // Global function banayein
  useEffect(() => {
    // @ts-ignore
    window.showAlert = showAlert;
  }, []);

  const getAlertStyles = (type: AlertType) => {
    const baseStyles = "p-4 rounded-lg shadow-lg border max-w-sm mx-auto mb-2 transition-all duration-300";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-100 border-green-400 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-100 border-red-400 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-100 border-yellow-400 text-yellow-800`;
      default:
        return `${baseStyles} bg-blue-100 border-blue-400 text-blue-800`;
    }
  };

  return (
    <>
      {/* Alert Container */}
      <div className="fixed top-4 right-4 z-50">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={getAlertStyles(alert.type)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{alert.message}</span>
              <button
                onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                className="ml-4 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Context Provider */}
      <AlertContext.Provider value={{ showAlert }}>
        {/* Empty - just for context */}
      </AlertContext.Provider>
    </>
  );
}