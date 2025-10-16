import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if we're in browser
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('authData') ? 
      JSON.parse(localStorage.getItem('authData')!).token : null;

    if (!token) {
      console.log('🔴 No auth token found');
      return;
    }

    console.log('🔄 Starting socket connection...');

    // IMPORTANT: Correct socket URL and path
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://partsfinda.com'
      : 'http://localhost:3000';

    const socketInstance = io(socketUrl, {
      path: '/api/socketio/', // Must match the path in socket-server.ts
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'], // Try polling first, then websocket
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Connection events
    socketInstance.on('connect', () => {
      console.log('✅ Socket connected successfully!');
      setIsConnected(true);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error.message);
      console.error('Error details:', error);
      setIsConnected(false);
    });

    socketInstance.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}`);
    });

    socketInstance.on('reconnect', () => {
      console.log('✅ Reconnected successfully');
      setIsConnected(true);
    });

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket connection');
      if (socketInstance.connected) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return { socket, isConnected };
};