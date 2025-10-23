// components/AlertContainer.tsx
'use client';

import { useAlert } from '@/context/AlertContext';
import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function AlertContainer() {
  const { alerts, hideAlert } = useAlert();
  const [visibleAlerts, setVisibleAlerts] = useState<string[]>([]);

  useEffect(() => {
    // New alerts ko visible banayein
    const newAlertIds = alerts.map(alert => alert.id);
    setVisibleAlerts(prev => [...prev, ...newAlertIds.filter(id => !prev.includes(id))]);
  }, [alerts]);

  const handleHide = (id: string) => {
    setVisibleAlerts(prev => prev.filter(alertId => alertId !== id));
    setTimeout(() => hideAlert(id), 300); // Animation ke liye delay
  };

  const getAlertConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          progress: 'bg-green-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          progress: 'bg-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
          progress: 'bg-yellow-500'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: <Info className="w-5 h-5 text-blue-500" />,
          progress: 'bg-blue-500'
        };
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {alerts.map((alert) => {
        const config = getAlertConfig(alert.type);
        const isVisible = visibleAlerts.includes(alert.id);

        return (
          <div
            key={alert.id}
            className={`
              ${config.bg} border rounded-lg shadow-lg p-4 transition-all duration-300 transform
              ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
          >
            <div className="flex items-start gap-3">
              {config.icon}
              <div className="flex-1">
                <p className={`text-sm font-medium ${config.text}`}>
                  {alert.message}
                </p>
              </div>
              <button
                onClick={() => handleHide(alert.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Progress bar for auto-dismiss */}
            {alert.duration && alert.duration > 0 && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${config.progress} transition-all duration-${alert.duration}`}
                  style={{ 
                    width: '100%',
                    animation: `shrink ${alert.duration}ms linear forwards` 
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}