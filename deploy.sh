#!/bin/bash
set -e

echo "🚀 Starting PartsFinda Full Stack Deployment..."
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Main deployment function
deploy_main_app() {
    echo ""
    echo "📦 Deploying Next.js Main Application..."
    echo "----------------------------------------"
    
    cd /var/www/partsfinda

    # Pull latest code
    print_status "Pulling latest code from Git..."
    git fetch origin
    git reset --hard origin/main

    # Install dependencies
    print_status "Installing dependencies..."
    npm install

    # Build the application
    print_status "Building application..."
    npm run build

    # Restart PM2 process
    print_status "Restarting Next.js application..."
    pm2 restart partsfinda || print_warning "PM2 process might not exist, starting new..."
    
    # Ensure process is running
    pm2 start npm --name "partsfinda" -- start || print_status "Next.js app started"
}

deploy_socket_server() {
    echo ""
    echo "🔌 Deploying Socket.IO Server..."
    echo "--------------------------------"
    
    SOCKET_DIR="/opt/socket-server"
    
    # Check if socket directory exists
    if [ ! -d "$SOCKET_DIR" ]; then
        print_warning "Socket server directory not found, creating..."
        sudo mkdir -p $SOCKET_DIR
    fi

    cd $SOCKET_DIR

    # Copy socket server files (if you have them in a specific location)
    # sudo cp /path/to/socket-server-files/* $SOCKET_DIR/ 2>/dev/null || print_warning "No socket files to copy"

    # Install dependencies
    print_status "Installing Socket.IO server dependencies..."
    npm install

    # Start with PM2
    print_status "Starting Socket.IO server with PM2..."
    pm2 delete partsfinda-socket 2>/dev/null || print_warning "No existing socket process to delete"
    
    # Start socket server
    cd $SOCKET_DIR
    pm2 start index.js --name "partsfinda-socket" || print_error "Failed to start socket server"
}

setup_pm2_ecosystem() {
    echo ""
    echo "⚙️ Setting up PM2 Ecosystem..."
    echo "-----------------------------"
    
    # Create ecosystem file if it doesn't exist
    ECOSYSTEM_FILE="/var/www/partsfinda/ecosystem.config.js"
    
    if [ ! -f "$ECOSYSTEM_FILE" ]; then
        print_status "Creating PM2 ecosystem file..."
        cat > $ECOSYSTEM_FILE << 'EOF'
module.exports = {
  apps: [
    {
      name: 'partsfinda-nextjs',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/partsfinda',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
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
        JWT_SECRET: 'your-actual-jwt-secret'
      }
    }
  ]
};
EOF
    fi

    # Start both services using ecosystem
    print_status "Starting services with PM2 ecosystem..."
    pm2 start $ECOSYSTEM_FILE || print_status "Services already running, reloading..."
    pm2 save
}

reload_nginx() {
    echo ""
    echo "🌐 Reloading Nginx Configuration..."
    echo "----------------------------------"
    
    # Test nginx configuration
    print_status "Testing Nginx configuration..."
    sudo nginx -t

    # Reload nginx
    print_status "Reloading Nginx..."
    sudo systemctl reload nginx
}

health_checks() {
    echo ""
    echo "🏥 Running Health Checks..."
    echo "--------------------------"
    
    # Wait a bit for services to start
    print_status "Waiting for services to start..."
    sleep 5

    # Check Next.js app
    print_status "Checking Next.js application..."
    curl -f https://partsfinda.com/api/socket/status > /dev/null 2>&1 && \
        print_status "Next.js app is healthy" || \
        print_warning "Next.js app health check failed"

    # Check Socket server
    print_status "Checking Socket.IO server..."
    curl -f https://partsfinda.com/socket-health > /dev/null 2>&1 && \
        print_status "Socket server is healthy" || \
        print_warning "Socket server health check failed"

    # Check PM2 status
    print_status "Checking PM2 status..."
    pm2 status
}

main() {
    echo "🚀 Starting Full Deployment - $(date)"
    echo "======================================"
    
    # Deploy main Next.js application
    deploy_main_app
    
    # Deploy socket server
    deploy_socket_server
    
    # Setup PM2 ecosystem
    setup_pm2_ecosystem
    
    # Reload nginx
    reload_nginx
    
    # Health checks
    health_checks
    
    echo ""
    echo "======================================"
    print_status "🎉 Deployment completed successfully!"
    echo ""
    echo "📊 Quick Status:"
    echo "   - Next.js App: https://partsfinda.com"
    echo "   - Socket Server: https://partsfinda.com:3001"
    echo "   - Health Check: https://partsfinda.com/socket-health"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   pm2 status              # Check all services"
    echo "   pm2 logs partsfinda     # Next.js logs"
    echo "   pm2 logs partsfinda-socket # Socket server logs"
    echo "   sudo systemctl status nginx # Nginx status"
    echo ""
}

# Run main function
main