// components/AlertManager.tsx
'use client';

import { useState, useEffect, createContext, useContext } from 'react';

type AlertType = 'successmsg' | 'errormsg' | 'warningmsg' | 'infomsg';

interface Alert {
  id: string;
  message: string;
  type: AlertType;
  duration?: number;
}

const AlertContext = createContext<{
  showAlert: (message: string, type?: AlertType, duration?: number) => void;
}>({
  showAlert: () => {},
});

export const useAlert = () => useContext(AlertContext);

export default function AlertManager() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const showAlert = (message: string, type: AlertType = 'infomsg', duration = 10000) => {
    const id = Date.now().toString();
    const newAlert: Alert = { id, message, type, duration };
    
   // console.log('🚀 Showing alert:', message, type, `${duration}ms`);
    
    setAlerts(prev => [...prev, newAlert]);

    // Auto remove after duration (default 10 seconds)
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  // Global function banayein
  useEffect(() => {
    // @ts-ignore
    window.showAlert = showAlert;
  }, []);

  const getAlertConfig = (type: AlertType) => {
    switch (type) {
      case 'successmsg':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
          border: 'border-l-4 border-emerald-400',
          icon: '✅',
          progress: 'bg-emerald-300',
          title: 'Success'
        };
      case 'errormsg':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-rose-600', 
          border: 'border-l-4 border-rose-400',
          icon: '❌',
          progress: 'bg-rose-300',
          title: 'Error'
        };
      case 'warningmsg':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
          border: 'border-l-4 border-amber-400',
          icon: '⚠️',
          progress: 'bg-amber-300',
          title: 'Warning'
        };
      default: // infomsg
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-cyan-600',
          border: 'border-l-4 border-cyan-400',
          icon: 'ℹ️',
          progress: 'bg-cyan-300',
          title: 'Information'
        };
    }
  };

  return (
    <>
      {/* Alert Container - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm w-full">
        {alerts.map((alert, index) => {
          const config = getAlertConfig(alert.type);
          const position = alerts.length - index;
          
          return (
            <div
              key={alert.id}
              className={`
                ${config.bg} ${config.border} 
                text-white rounded-xl shadow-2xl 
                transform transition-all duration-500 ease-out
                hover:scale-105 hover:shadow-3xl
                backdrop-blur-sm bg-opacity-95
                border border-white border-opacity-20
                relative overflow-hidden
              `}
              style={{
                transform: `translateY(${(position - 1) * 8}px) scale(${1 - (position - 1) * 0.05})`
              }}
            >
              {/* Progress Bar - 10 seconds default */}
              {alert.duration && alert.duration > 0 && (
                <div className="absolute top-0 left-0 w-full h-1 bg-white bg-opacity-20">
                  <div
                    className={`h-full ${config.progress}`}
                    style={{ 
                      animation: `shrink ${alert.duration}ms linear forwards` 
                    }}
                  />
                </div>
              )}

              {/* Alert Content */}
              <div className="p-4 pl-5 pr-12">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 text-lg">
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white opacity-90">
                      {config.title}
                    </p>
                    <p className="text-sm font-medium leading-5 text-white mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-white opacity-70 mt-2">
                      {alert.duration ? `Auto closes in ${alert.duration/1000}s` : 'Click to close'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeAlert(alert.id)}
                className="absolute top-3 right-3 
                  text-white hover:text-gray-200 
                  transition-colors duration-200
                  rounded-full p-1 hover:bg-white hover:bg-opacity-10
                  text-lg font-bold"
                title="Close notification"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Context Provider */}
      <AlertContext.Provider value={{ showAlert }}>
        {/* Empty - just for context */}
      </AlertContext.Provider>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes slideIn {
          from { 
            transform: translateX(100px);
            opacity: 0; 
          }
          to { 
            transform: translateX(0);
            opacity: 1; 
          }
        }

        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>
    </>
  );
}