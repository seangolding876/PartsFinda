import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authData') ? 
      JSON.parse(localStorage.getItem('authData')!).token : null;

    if (!token) {
      console.log('No token found for socket connection');
      return;
    }

    // Next.js compatible socket connection
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://partsfinda.com'
      : 'http://localhost:3000';

    console.log('Connecting to socket:', socketUrl);

    const socketInstance = io(socketUrl, {
      path: '/api/socketio', // Important: Match the path in socket-server.ts
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error.message);
      setIsConnected(false);
    });

    return () => {
      console.log('Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
};