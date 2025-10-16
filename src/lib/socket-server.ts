import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as SocketServer } from 'socket.io';
import { verifyToken } from './jwt';

let io: SocketServer | null = null;

export const initSocketServer = (server: NetServer) => {
  if (io) {
    return io;
  }

  io = new SocketServer(server, {
    path: '/api/socketio', // Important: Specific path for Next.js
    cors: {
      origin: [
        "https://partsfinda.com",
        "http://localhost:3000",
        "https://www.partsfinda.com"
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Rest of your socket server code remains same as before...
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const userInfo = verifyToken(token);
      socket.data.userId = userInfo.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.data.userId);
    socket.join(`user_${socket.data.userId}`);

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.data.userId} joined conversation ${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    socket.on('send_message', async (data) => {
      try {
        const { conversationId, messageText, receiverId } = data;
        
        if (!conversationId || !messageText || !receiverId) {
          socket.emit('message_error', { error: 'Missing required fields' });
          return;
        }

        const { query } = await import('./db');
        const messageResult = await query(
          `INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text) 
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [conversationId, socket.data.userId, receiverId, messageText]
        );

        await query(
          'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
          [conversationId]
        );

        const newMessage = messageResult.rows[0];

        io?.to(`conversation_${conversationId}`).emit('new_message', {
          id: newMessage.id,
          text: newMessage.message_text,
          sender: newMessage.sender_id === socket.data.userId ? 'buyer' : 'seller',
          timestamp: newMessage.created_at,
          status: 'delivered'
        });

        io?.to(`user_${receiverId}`).emit('conversation_updated', {
          conversationId,
          lastMessage: newMessage.message_text,
          timestamp: newMessage.created_at
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.data.userId);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};