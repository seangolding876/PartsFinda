// /context/NotificationContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface NotificationContextType {
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
  redirectToDashboard: string | null; // ✅ Naya add karein
  setRedirectToDashboard: (dashboard: string | null) => void; // ✅ Naya add karein
}

const NotificationContext = createContext<NotificationContextType>({
  selectedRequestId: null,
  setSelectedRequestId: () => {},
  redirectToDashboard: null,
  setRedirectToDashboard: () => {}
});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [redirectToDashboard, setRedirectToDashboard] = useState<string | null>(null);

  return (
    <NotificationContext.Provider value={{ 
      selectedRequestId, 
      setSelectedRequestId,
      redirectToDashboard,
      setRedirectToDashboard
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);