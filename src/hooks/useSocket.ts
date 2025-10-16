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

    // ✅ Nginx ke through connect karo (without port)
    const socketUrl = 'https://partsfinda.com';

    const socketInstance = io(socketUrl, {
      path: '/socket.io/',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
      forceNew: true
    });

    socketInstance.on('connect', () => {
      console.log('✅ CONNECTED to Socket Server!');
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