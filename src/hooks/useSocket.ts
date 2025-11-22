// hooks/useSocket.ts - UPDATED & FIXED VERSION
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get auth token safely
    const getAuthToken = () => {
      try {
        const authData = localStorage.getItem('authData');
        if (!authData) return null;
        const parsed = JSON.parse(authData);
        return parsed.token || null;
      } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
      }
    };

    const token = getAuthToken();
    
    if (!token) {
    //  console.log('🔴 No auth token found for socket connection');
      setConnectionError('Authentication required');
      return;
    }

    console.log('🔄 Starting socket connection...');

    // ✅ FIXED: Use correct socket URL and path
    const socketUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001' 
      : 'https://partsfinda.com';

    const socketInstance = io(socketUrl, {
      path: '/socket.io/', // ✅ Nginx expects this path
      auth: { 
        token 
      },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true, // ✅ Better for reconnections
      withCredentials: true, // ✅ Important for cookies/auth
      autoConnect: true
    });

    // Connection events
    socketInstance.on('connect', () => {
      // console.log('✅ CONNECTED to Socket Server!', {
      //   id: socketInstance.id,
      //   connected: socketInstance.connected
      // });
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', (reason) => {
   //   console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server forcibly disconnected, need to manually reconnect
     //   console.log('🔄 Server disconnected, attempting reconnect...');
        setTimeout(() => {
          socketInstance.connect();
        }, 1000);
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', {
        message: error.message,
      });
      setIsConnected(false);
      setConnectionError(`Connection failed: ${error.message}`);
      
      // Auto-retry after delay
      const attempts = reconnectAttempts + 1;
      setReconnectAttempts(attempts);
      
      if (attempts <= 5) {
       // console.log(`🔄 Retry attempt ${attempts}/5 in 3 seconds...`);
        setTimeout(() => {
          socketInstance.connect();
        }, 3000);
      }
    });

    socketInstance.on('reconnect_attempt', (attempt) => {
    //  console.log(`🔄 Socket reconnection attempt ${attempt}`);
      setReconnectAttempts(attempt);
    });

    socketInstance.on('reconnect', (attempt) => {
    //  console.log(`✅ Socket reconnected after ${attempt} attempts`);
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('🔴 Socket reconnection failed after all attempts');
      setConnectionError('Unable to connect to server');
    });

    socketInstance.on('session_conflict', () => {
      console.warn('🚨 Multiple sessions detected - logging out');
      localStorage.removeItem('authData');
      window.location.reload();
    });

    socketInstance.on('error', (error) => {
      console.error('🔴 Socket error:', error);
      setConnectionError(`Socket error: ${error.message}`);
    });

    // Manual connection trigger
    socketInstance.connect();

    return () => {
    //  console.log('🧹 Cleaning up socket connection');
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, []);

  return { 
    socket, 
    isConnected,
    connectionError,
    reconnectAttempts
  };
};