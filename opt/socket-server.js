const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://partsfinda.com",
      "https://www.partsfinda.com", 
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// JWT Verification
const verifyToken = (token) => {
  try {
    if (!token) throw new Error('No token provided');
    
    // Replace 'your-jwt-secret' with actual secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Authentication Middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    console.log('🔐 Socket auth attempt');
    
    if (!token) {
      return next(new Error('No token provided'));
    }
    
    const userInfo = verifyToken(token);
    socket.data.userId = userInfo.userId;
    socket.data.userInfo = userInfo;
    
    console.log('✅ Socket authenticated for user:', userInfo.userId);
    next();
  } catch (error) {
    console.error('❌ Socket auth error:', error.message);
    next(new Error('Authentication failed'));
  }
});

// Socket Events
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.data.userId);
  
  // Join user's personal room
  socket.join(`user_${socket.data.userId}`);
  
  // Join conversation
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`User ${socket.data.userId} joined conversation ${conversationId}`);
  });

  // Leave conversation
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      console.log('📨 Received message:', data);
      const { conversationId, messageText, receiverId } = data;
      
      if (!conversationId || !messageText || !receiverId) {
        socket.emit('message_error', { error: 'Missing required fields' });
        return;
      }

      // TODO: Database save logic yahan add karen
      // Temporary simulation
      const newMessage = {
        id: Date.now().toString(),
        message_text: messageText,
        sender_id: socket.data.userId,
        created_at: new Date().toISOString()
      };

      console.log('💾 Message saved (simulated):', newMessage);

      // Broadcast to conversation room
      io.to(`conversation_${conversationId}`).emit('new_message', {
        id: newMessage.id,
        text: newMessage.message_text,
        sender: newMessage.sender_id === socket.data.userId ? 'buyer' : 'seller',
        timestamp: newMessage.created_at,
        status: 'delivered'
      });

      // Notify receiver
      io.to(`user_${receiverId}`).emit('conversation_updated', {
        conversationId,
        lastMessage: newMessage.message_text,
        timestamp: newMessage.created_at,
        senderId: socket.data.userId
      });

      console.log('✅ Message broadcasted successfully');

    } catch (error) {
      console.error('❌ Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Typing indicators
  socket.on('typing_start', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: socket.data.userId,
      typing: true,
      userName: socket.data.userInfo?.name || 'User'
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: socket.data.userId,
      typing: false
    });
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ User disconnected:', socket.data.userId, 'Reason:', reason);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connectedClients: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Socket.IO Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});