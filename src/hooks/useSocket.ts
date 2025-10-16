import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// hooks/useSocket.ts - FIXED VERSION
export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('authData') ? 
      JSON.parse(localStorage.getItem('authData')!).token : null;

    if (!token) {
      console.log('🔴 No auth token found');
      return;
    }

    console.log('🔄 Starting socket connection...');

    // Use the same domain without port (Nginx proxy)
    const socketUrl = 'https://partsfinda.com';

    const socketInstance = io(socketUrl, {
      path: '/socket.io/',
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: false // Change to false for better reconnection
    });

    // Connection events
    socketInstance.on('connect', () => {
      console.log('✅ CONNECTED to Socket Server!', socketInstance.id);
      setIsConnected(true);
      setConnectionError(null);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
      setIsConnected(false);
      setConnectionError(`Disconnected: ${reason}`);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error.message);
      setIsConnected(false);
      setConnectionError(`Connection failed: ${error.message}`);
    });

    socketInstance.on('reconnect', (attempt) => {
      console.log('🔄 Reconnected after', attempt, 'attempts');
      setIsConnected(true);
    });

    return () => {
      console.log('🧹 Cleaning up socket connection');
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, []);

  return { 
    socket, 
    isConnected,
    connectionError
  };
};