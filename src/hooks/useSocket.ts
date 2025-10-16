import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // ✅ FIX: Add the correct port or use the correct endpoint
    const socketUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001' 
      : 'https://partsfinda.com:3001'; // Add port for production

    // OR if you have a proxy setup, use:
    // const socketUrl = 'https://partsfinda.com';

    const socketInstance = io(socketUrl, {
      path: '/socket.io/',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 30000,
      forceNew: true
    });

    // Add more detailed logging
    socketInstance.on('connect', () => {
      console.log('✅ CONNECTED to Socket Server!', socketInstance.id);
      setIsConnected(true);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error.message);
      console.error('Error details:', error);
      setIsConnected(false);
    });

    socketInstance.on('connect_timeout', (timeout) => {
      console.error('⏰ Connection timeout occurred');
    });

    // Test if socket can reach the server
    console.log('🔗 Attempting connection to:', socketUrl);

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