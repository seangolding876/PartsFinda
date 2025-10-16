import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('authData') ? 
      JSON.parse(localStorage.getItem('authData')!).token : null;

    if (!token) {
      console.log('🔴 No auth token found');
      return;
    }

    console.log('🔄 Starting socket connection to VPS...');
    setConnectionStatus('connecting');

    // VPS Socket server URL - Port 3001 pe
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://partsfinda.com:3001'  // VPS pe socket server
      : 'http://localhost:3001';       // Local development

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    // Connection events
    socketInstance.on('connect', () => {
      console.log('✅ CONNECTED to VPS Socket Server!');
      setIsConnected(true);
      setConnectionStatus('connected');
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Disconnected from VPS:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Connection error to VPS:', error.message);
      setIsConnected(false);
      setConnectionStatus('error');
    });

    socketInstance.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt} to VPS`);
      setConnectionStatus('reconnecting');
    });

    socketInstance.on('reconnect', (attempt) => {
      console.log('✅ Reconnected to VPS on attempt', attempt);
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('🔴 All reconnection attempts to VPS failed');
      setConnectionStatus('failed');
    });

    return () => {
      console.log('🧹 Cleaning up VPS socket connection');
      socketInstance.disconnect();
    };
  }, []);

  return { 
    socket, 
    isConnected, 
    connectionStatus 
  };
};