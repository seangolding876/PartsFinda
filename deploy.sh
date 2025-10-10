#!/bin/bash

# Deployment Script for PartsFinda
set -e

echo "🚀 Starting PartsFinda Deployment..."

# Environment setup
PROJECT_DIR="/var/www/partsfinda"
BACKUP_DIR="/var/www/backups/partsfinda"
LOG_FILE="/var/log/partsfinda-deploy.log"

# Create backup and log directories
mkdir -p $BACKUP_DIR

# Logging function
log() {
    echo "$(date): $1" >> $LOG_FILE
    echo "$1"
}

# Error handling
error_exit() {
    log "❌ DEPLOYMENT FAILED: $1"
    exit 1
}

# Main deployment function
deploy() {
    log "📦 Starting deployment process..."
    
    # Backup current build if exists
    if [ -d "$PROJECT_DIR/.next" ]; then
        log "💾 Creating backup of current build..."
        tar -czf "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C $PROJECT_DIR .next package.json >> $LOG_FILE 2>&1
    fi
    
    # Pull latest code
    log "🔁 Pulling latest code from Git..."
    cd $PROJECT_DIR
    git fetch origin
    git reset --hard origin/main
    
    # Install dependencies
    log "📚 Installing dependencies..."
    npm install >> $LOG_FILE 2>&1
    
    # Build the application
    log "🏗️ Building application..."
    npm run build >> $LOG_FILE 2>&1
    
    # Restart PM2 process
    log "🔄 Restarting application..."
    pm2 reload partsfinda --update-env >> $LOG_FILE 2>&1
    
    log "✅ Deployment completed successfully!"
}

# Run deployment
deploy