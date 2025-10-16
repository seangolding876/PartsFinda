import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('authData') ? 
      JSON.parse(localStorage.getItem('authData')!).token : null;

    if (!token) {
      console.log('🔴 No auth token found');
      return;
    }

    console.log('🔄 Starting socket connection...');

    // ✅ Now using same domain without port (via Nginx proxy)
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://partsfinda.com'  // No port needed - Nginx will proxy to 3001
      : 'http://localhost:3001';   // Local development still uses port

    const socketInstance = io(socketUrl, {
      path: '/socket.io/', // ✅ Important: This matches Nginx location
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ CONNECTED to Socket Server via Nginx!');
      setIsConnected(true);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error.message);
      setIsConnected(false);
    });

    return () => {
      console.log('🧹 Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, []);

  return { 
    socket, 
    isConnected
  };
};