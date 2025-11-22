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

  const showAlert = (
    message: string,
    type: AlertType = 'infomsg',
    duration = 3500
  ) => {
    const id = Date.now().toString();
    const newAlert: Alert = { id, message, type, duration };

    setAlerts(prev => [...prev, newAlert]);

    setTimeout(() => removeAlert(id), duration);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  useEffect(() => {
    // @ts-ignore
    window.showAlert = showAlert;
  }, []);

  const getStyle = (type: AlertType) => {
    switch (type) {
      case 'successmsg':
        return "bg-emerald-200/60 text-emerald-900";
      case 'errormsg':
        return "bg-rose-200/60 text-rose-900";
      case 'warningmsg':
        return "bg-amber-200/60 text-amber-900";
      default:
        return "bg-sky-200/60 text-sky-900";
    }
  };

  return (
    <>
      {/* PREMIUM CENTER-BOTTOM TOAST */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] 
                      w-[90%] sm:w-auto max-w-sm flex flex-col gap-3">

        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`
              ${getStyle(alert.type)}
              px-4 py-3 rounded-2xl
              shadow-[0_4px_22px_rgba(0,0,0,0.15)]
              backdrop-blur-xl backdrop-saturate-150
              border border-white/30
              text-sm font-medium text-center
              animate-toast
            `}
            onClick={() => removeAlert(alert.id)}
          >
            {alert.message}
          </div>
        ))}

      </div>

      <AlertContext.Provider value={{ showAlert }} />

      <style jsx>{`
        @keyframes toast {
          0% {
            transform: translateY(20px) scale(0.95);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        .animate-toast {
          animation: toast 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}
