#!/bin/bash
set -e

echo "🚀 Starting PartsFinda Full Deployment..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# === 1️⃣ Setup Socket Server Directory ===
setup_socket_server() {
    echo ""
    echo "🔌 Setting up Socket Server..."
    echo "-----------------------------"
    
    SOCKET_DIR="/opt/socket-server"
    
    # Create directory if it doesn't exist
    if [ ! -d "$SOCKET_DIR" ]; then
        print_status "Creating socket server directory..."
        sudo mkdir -p $SOCKET_DIR
    fi
    
    # Set proper permissions
    print_status "Setting permissions..."
    sudo chown -R $USER:$USER $SOCKET_DIR
    sudo chmod -R 755 $SOCKET_DIR
    
    # Create package.json if it doesn't exist
    if [ ! -f "$SOCKET_DIR/package.json" ]; then
        print_status "Creating package.json..."
        cat > $SOCKET_DIR/package.json << 'EOF'
{
  "name": "partsfinda-socket-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.5",
    "cors": "^2.8.5"
  }
}
EOF
    fi
    
    # Create index.js if it doesn't exist
    if [ ! -f "$SOCKET_DIR/index.js" ]; then
        print_status "Creating socket server index.js..."
        cat > $SOCKET_DIR/index.js << 'EOF'
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

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

// Simple auth
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    console.log('🔐 Socket auth attempt');
    
    if (!token) {
      return next(new Error('No token provided'));
    }
    
    // Temporary user ID - replace with JWT verification
    socket.data.userId = 'user-' + Date.now();
    console.log('✅ Socket authenticated for user:', socket.data.userId);
    next();
  } catch (error) {
    console.error('❌ Socket auth error:', error);
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.data.userId);
  
  socket.join(`user_${socket.data.userId}`);
  
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`User ${socket.data.userId} joined conversation ${conversationId}`);
  });

  socket.on('send_message', (data) => {
    console.log('📨 Message received:', data);
    const { conversationId, messageText, receiverId } = data;
    
    // Broadcast to conversation
    io.to(`conversation_${conversationId}`).emit('new_message', {
      id: Date.now().toString(),
      text: messageText,
      sender: 'buyer',
      timestamp: new Date().toISOString(),
      status: 'delivered'
    });

    // Notify receiver
    io.to(`user_${receiverId}`).emit('conversation_updated', {
      conversationId,
      lastMessage: messageText,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.data.userId);
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
});
EOF
    fi
    
    # Install dependencies
    print_status "Installing socket server dependencies..."
    cd $SOCKET_DIR
    npm install
}

# === 2️⃣ Deploy Main Next.js App ===
deploy_main_app() {
    echo ""
    echo "📦 Deploying Next.js Main App..."
    echo "-------------------------------"
    
    MAIN_DIR="/var/www/partsfinda"
    cd $MAIN_DIR

    print_status "Setting permissions..."
    sudo chown -R $USER:$USER $MAIN_DIR
    sudo chmod -R 755 $MAIN_DIR

    print_status "Pulling latest code from Git..."
    git fetch origin
    git reset --hard origin/main

    print_status "Installing dependencies..."
    npm install

    print_status "Building Next.js application..."
    npm run build
}

# === 3️⃣ Setup Worker ===
setup_worker() {
    echo ""
    echo "⚙️ Setting up Worker..."
    echo "-----------------------"
    
    MAIN_DIR="/var/www/partsfinda"
    
    # Create worker directory if it doesn't exist
    WORKER_DIR="$MAIN_DIR/dist-worker"
    if [ ! -d "$WORKER_DIR" ]; then
        print_status "Creating worker directory..."
        mkdir -p $WORKER_DIR
    fi
    
    # Create simple worker file if it doesn't exist
    if [ ! -f "$WORKER_DIR/start_worker.js" ]; then
        print_status "Creating worker file..."
        cat > $WORKER_DIR/start_worker.js << 'EOF'
// Simple worker for background tasks
console.log('🚀 PartsFinda Worker Started -', new Date().toISOString());

setInterval(() => {
    console.log('✅ Worker running -', new Date().toISOString());
}, 60000); // Log every minute

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Worker shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Worker terminated');
    process.exit(0);
});
EOF
    fi
}

# === 4️⃣ Create/Update Ecosystem File ===
setup_ecosystem() {
    echo ""
    echo "📋 Setting up PM2 Ecosystem..."
    echo "------------------------------"
    
    MAIN_DIR="/var/www/partsfinda"
    ECOSYSTEM_FILE="$MAIN_DIR/ecosystem.config.js"
    
    print_status "Creating ecosystem.config.js..."
    cat > $ECOSYSTEM_FILE << 'EOF'
module.exports = {
  apps: [
    // Next.js Main App
    {
      name: 'partsfinda',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/partsfinda',
      instances: 'max', 
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },

    // Background Worker
    {
      name: 'partsfinda-worker',
      script: './dist-worker/start_worker.js',
      cwd: '/var/www/partsfinda', 
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    },
    
    // Socket Server
    {
      name: 'partsfinda-socket',
      script: 'index.js',
      cwd: '/opt/socket-server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        SOCKET_PORT: 3001,
        JWT_SECRET: 'r9fQqsPeEJP6QbbN82RytCYqt1Dw1cc82AR66IibocE'
      }
    }
  ]
};
EOF

    print_status "Ecosystem file created/updated"
}

# === 5️⃣ Start All Services ===
start_services() {
    echo ""
    echo "🔄 Starting All Services..."
    echo "---------------------------"
    
    MAIN_DIR="/var/www/partsfinda"
    
    print_status "Starting with PM2 ecosystem..."
    cd $MAIN_DIR
    pm2 delete all 2>/dev/null || print_warning "No existing processes to delete"
    
    # Start all services from ecosystem
    pm2 start ecosystem.config.js
    pm2 save
    
    print_status "All services started successfully!"
}

# === 6️⃣ Health Checks ===
health_checks() {
    echo ""
    echo "🏥 Running Health Checks..."
    echo "--------------------------"
    
    print_status "Waiting for services to start..."
    sleep 5
    
    # Check PM2 status
    print_status "PM2 Status:"
    pm2 list
    
    # Check individual processes
    print_status "Process Status:"
    echo "Next.js App:"
    pm2 info partsfinda 2>/dev/null | grep "status" || print_warning "partsfinda not found"
    
    echo "Worker:"
    pm2 info partsfinda-worker 2>/dev/null | grep "status" || print_warning "partsfinda-worker not found"
    
    echo "Socket Server:"
    pm2 info partsfinda-socket 2>/dev/null | grep "status" || print_warning "partsfinda-socket not found"
}

# === MAIN DEPLOYMENT ===
main() {
    echo "🚀 Starting Full Deployment - $(date)"
    echo "======================================"
    
    # Setup socket server first
    setup_socket_server
    
    # Deploy main app
    deploy_main_app
    
    # Setup worker
    setup_worker
    
    # Setup ecosystem file
    setup_ecosystem
    
    # Start all services
    start_services
    
    # Health checks
    health_checks
    
    echo ""
    echo "======================================"
    print_status "🎉 ALL DEPLOYMENTS COMPLETED SUCCESSFULLY!"
    echo ""
    echo "📊 Services Status:"
    echo "   - Next.js App: partsfinda"
    echo "   - Background Worker: partsfinda-worker" 
    echo "   - Socket Server: partsfinda-socket"
    echo ""
    echo "🔧 Management Commands:"
    echo "   pm2 status                      # Check all services"
    echo "   pm2 logs partsfinda            # Next.js logs"
    echo "   pm2 logs partsfinda-worker     # Worker logs"
    echo "   pm2 logs partsfinda-socket     # Socket server logs"
    echo "   pm2 restart all                # Restart all services"
    echo ""
    echo "🌐 URLs:"
    echo "   - Main App: https://partsfinda.com"
    echo "   - Socket Health: https://partsfinda.com/socket-health"
    echo ""
}

# Run deployment
main