#!/bin/bash
set -e

echo "🚀 PartsFinda Quick Deployment"

# === 1. FIX PERMISSIONS ===
echo "🔧 Fixing permissions..."
sudo chown -R $USER:$USER /var/www/partsfinda
sudo chmod -R 755 /var/www/partsfinda

# === 2. CLEAN OLD BUILD ===  
echo "🧹 Cleaning old build..."
cd /var/www/partsfinda
rm -rf .next 2>/dev/null || true

# === 3. DEPLOY MAIN APP ===
echo "📦 Deploying main app..."
git fetch origin
git reset --hard origin/main
npm install
npm run build

# === 4. SETUP SOCKET SERVER ===
echo "🔌 Setting up socket server..."
sudo chown -R $USER:$USER /opt/socket-server
cd /opt/socket-server
npm install

# === 5. START ALL SERVICES ===
echo "🔄 Starting services..."
cd /var/www/partsfinda
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# === 6. VERIFY ===
echo " Deployment complete!"
echo "📊 Status: pm2 status"
echo "🔍 Logs: pm2 logs"