#!/bin/bash

echo "🚀 Deploying Socket Server to VPS..."

# Socket server directory
SOCKET_DIR="/opt/socket-server"

# Create directory if not exists
sudo mkdir -p $SOCKET_DIR

# Copy files
sudo cp socket-server/* $SOCKET_DIR/

# Install dependencies
cd $SOCKET_DIR
sudo npm install

# Start with PM2
sudo pm2 delete partsfinda-socket 2>/dev/null || true
sudo pm2 start ecosystem.config.js --only partsfinda-socket
sudo pm2 save

echo "✅ Socket server deployed successfully!"
echo "📊 Check status: pm2 status"
echo "🔍 Check logs: pm2 logs partsfinda-socket"