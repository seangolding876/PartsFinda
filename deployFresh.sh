#!/bin/bash
# Next.js VPS Deploy Script
# Cleans old build, reinstalls deps, rebuilds, restarts app, ensures Nginx config correct

APP_DIR="/var/www/partsfinda"
APP_NAME="partsfinda"   # PM2 app name

echo "🚀 Starting Next.js deploy script..."

# 1️⃣ Go to project directory
cd $APP_DIR || { echo "❌ Cannot cd to $APP_DIR"; exit 1; }

# 2️⃣ Remove old build and node_modules
echo "🧹 Cleaning old build and node_modules..."
rm -rf .next
rm -rf node_modules

# 3️⃣ Install dependencies fresh
echo "📦 Installing dependencies..."
npm install || { echo "❌ npm install failed"; exit 1; }

# 4️⃣ Rebuild Next.js
echo "🛠 Building Next.js app..."
npm run build || { echo "❌ npm run build failed"; exit 1; }

# 5️⃣ Restart app via PM2
echo "🔄 Restarting app via PM2..."
pm2 restart $APP_NAME || pm2 start npm --name "$APP_NAME" -- start || { echo "❌ PM2 start failed"; exit 1; }

# 6️⃣ Ensure Nginx proxy is correct
NGINX_CONF="/etc/nginx/sites-available/partsfinda.com"
echo "📝 Checking Nginx config..."
if grep -q "_next/static" "$NGINX_CONF"; then
    echo "⚠ Removing _next/static alias from Nginx..."
    sudo sed -i '/location \/\\_next\/static\//,/}/d' "$NGINX_CONF"
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx reloaded with correct proxy config"
else
    echo "✅ Nginx already correctly configured"
fi

echo "🎉 Deploy completed! Clear browser cache or use Incognito to see latest changes."
