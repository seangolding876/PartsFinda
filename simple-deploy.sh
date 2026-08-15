
#!/bin/bash
set -e

echo "🚀 Starting PartsFinda Deployment..."

cd /var/www/partsfinda

# Pull latest code
echo "🔁 Pulling latest code from Git..."
git fetch origin
git reset --hard origin/main

# Install dependencies
echo "📚 Installing dependencies..."
npm install

# Build the application
echo "🏗️ Building application..."
npm run build

# Restart PM2 process
echo "🔄 Restarting application..."
pm2 restart partsfinda

echo " Deployment completed successfully!"


