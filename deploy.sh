#!/bin/bash

# Enhanced Deployment Script for PartsFinda
set -e

echo "🚀 Starting Enhanced PartsFinda Deployment..."

# Environment setup
PROJECT_DIR="/var/www/partsfinda"
BACKUP_DIR="/var/www/backups/partsfinda"
LOG_DIR="/var/log/partsfinda"
DEPLOY_LOG="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"
CONFIG_FILE="$PROJECT_DIR/deploy.config"

# Create directories
mkdir -p $BACKUP_DIR $LOG_DIR

# Load configuration
if [ -f "$CONFIG_FILE" ]; then
    source $CONFIG_FILE
else
    BRANCH="main"
    NODE_ENV="production"
    ENABLE_WORKER=true
    RUN_MIGRATIONS=true
    BACKUP_ENABLED=true
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local message="$1"
    local color="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${color}${timestamp}: ${message}${NC}" | tee -a $DEPLOY_LOG
}

# Error handling
error_exit() {
    log "❌ DEPLOYMENT FAILED: $1" "$RED"
    
    # Send notification (you can integrate with Slack/Email here)
    send_notification "DEPLOYMENT_FAILED" "$1"
    
    exit 1
}

# Send notifications (configure as needed)
send_notification() {
    local type="$1"
    local message="$2"
    
    # Example: Slack webhook
    # curl -X POST -H 'Content-type: application/json' \
    # --data "{\"text\":\"$type: $message\"}" \
    # $SLACK_WEBHOOK_URL
    
    log "📢 Notification: $type - $message" "$BLUE"
}

# Health check function
health_check() {
    local url="http://localhost:3000/api/health"
    local max_attempts=30
    local attempt=1
    
    log "🏥 Performing health check..." "$BLUE"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s --retry 3 --retry-delay 2 $url > /dev/null; then
            log "✅ Health check passed!" "$GREEN"
            return 0
        fi
        
        log "⏳ Health check attempt $attempt/$max_attempts failed, retrying..." "$YELLOW"
        sleep 5
        ((attempt++))
    done
    
    error_exit "Health check failed after $max_attempts attempts"
}

# Database migration function
run_migrations() {
    if [ "$RUN_MIGRATIONS" = "true" ]; then
        log "🗃️ Running database migrations..." "$BLUE"
        
        cd $PROJECT_DIR
        
        # Check if migration script exists
        if [ -f "scripts/migrate.js" ]; then
            node scripts/migrate.js >> $DEPLOY_LOG 2>&1 || {
                log "⚠️ Migration script not found or failed, continuing..." "$YELLOW"
            }
        else
            log "ℹ️ No migration script found, skipping migrations" "$YELLOW"
        fi
    else
        log "⏭️ Skipping database migrations" "$YELLOW"
    fi
}

# Backup function
create_backup() {
    if [ "$BACKUP_ENABLED" = "true" ]; then
        log "💾 Creating comprehensive backup..." "$BLUE"
        
        local backup_file="$BACKUP_DIR/full-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        
        # Backup important directories and files
        tar -czf $backup_file \
            -C $PROJECT_DIR \
            .next \
            package.json \
            package-lock.json \
            ecosystem.config.js \
            .env \
            --exclude='node_modules' \
            --exclude='.git' >> $DEPLOY_LOG 2>&1
        
        # Backup database (if you have pg_dump available)
        if command -v pg_dump &> /dev/null && [ -n "$DATABASE_URL" ]; then
            log "🗄️ Backing up database..." "$BLUE"
            pg_dump $DATABASE_URL > "$BACKUP_DIR/db-backup-$(date +%Y%m%d-%H%M%S).sql" 2>> $DEPLOY_LOG || {
                log "⚠️ Database backup failed, continuing..." "$YELLOW"
            }
        fi
        
        log "✅ Backup created: $(basename $backup_file)" "$GREEN"
        
        # Clean up old backups (keep last 10)
        ls -t $BACKUP_DIR/*.tar.gz | tail -n +11 | xargs rm -f --
        ls -t $BACKUP_DIR/*.sql | tail -n +11 | xargs rm -f --
    else
        log "⏭️ Backups disabled, skipping" "$YELLOW"
    fi
}

# Worker management
manage_worker() {
    if [ "$ENABLE_WORKER" = "true" ]; then
        log "👷 Managing worker process..." "$BLUE"
        
        # Check if worker is running
        if pm2 describe partsfinda-worker > /dev/null 2>&1; then
            log "🔄 Restarting worker..." "$BLUE"
            pm2 reload partsfinda-worker --update-env >> $DEPLOY_LOG 2>&1 || {
                log "⚠️ Worker reload failed, trying start..." "$YELLOW"
                pm2 start ecosystem.config.js --only partsfinda-worker >> $DEPLOY_LOG 2>&1
            }
        else
            log "🚀 Starting worker..." "$BLUE"
            pm2 start ecosystem.config.js --only partsfinda-worker >> $DEPLOY_LOG 2>&1
        fi
        
        # Wait for worker to start
        sleep 5
        
        # Check worker status
        local worker_status=$(pm2 jlist | jq -r '.[] | select(.name=="partsfinda-worker") | .pm2_env.status')
        if [ "$worker_status" = "online" ]; then
            log "✅ Worker started successfully" "$GREEN"
        else
            log "⚠️ Worker status: $worker_status" "$YELLOW"
        fi
    else
        log "⏭️ Worker disabled, skipping" "$YELLOW"
    fi
}

# Dependency check
check_dependencies() {
    log "🔍 Checking dependencies..." "$BLUE"
    
    local missing_deps=()
    
    # Check required commands
    for cmd in node npm git pm2 curl; do
        if ! command -v $cmd &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    # Check jq for JSON parsing
    if ! command -v jq &> /dev/null; then
        log "⚠️ jq not installed, some features may be limited" "$YELLOW"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error_exit "Missing dependencies: ${missing_deps[*]}"
    fi
    
    log "✅ All dependencies available" "$GREEN"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "🔍 Running pre-deployment checks..." "$BLUE"
    
    # Check if we're in the right directory
    if [ ! -d "$PROJECT_DIR" ]; then
        error_exit "Project directory $PROJECT_DIR does not exist"
    fi
    
    # Check if .env exists
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        error_exit ".env file not found in $PROJECT_DIR"
    fi
    
    # Check disk space
    local available_space=$(df /var/www | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 1048576 ]; then  # Less than 1GB
        error_exit "Insufficient disk space. Available: ${available_space}KB"
    fi
    
    log "✅ Pre-deployment checks passed" "$GREEN"
}

# Post-deployment cleanup
cleanup() {
    log "🧹 Performing cleanup..." "$BLUE"
    
    # Clean npm cache
    npm cache clean --force >> $DEPLOY_LOG 2>&1
    
    # Remove temporary files
    find $PROJECT_DIR -name "*.tmp" -delete
    find $PROJECT_DIR -name "*.log" -mtime +7 -delete
    
    log "✅ Cleanup completed" "$GREEN"
}

# Main deployment function
deploy() {
    local start_time=$(date +%s)
    
    log "📦 Starting enhanced deployment process..." "$BLUE"
    log "Branch: $BRANCH | Environment: $NODE_ENV" "$BLUE"
    
    # Run checks
    check_dependencies
    pre_deployment_checks
    
    # Create backup
    create_backup
    
    # Navigate to project directory
    cd $PROJECT_DIR
    
    # Pull latest code
    log "🔁 Pulling latest code from Git ($BRANCH)..." "$BLUE"
    git fetch origin
    git checkout $BRANCH
    git reset --hard origin/$BRANCH
    
    # Get latest commit info
    local commit_hash=$(git rev-parse --short HEAD)
    local commit_message=$(git log -1 --pretty=%B)
    log "📝 Deploying commit: $commit_hash - $commit_message" "$BLUE"
    
    # Install dependencies
    log "📚 Installing/updating dependencies..." "$BLUE"
    npm ci --production >> $DEPLOY_LOG 2>&1
    
    # Run migrations
    run_migrations
    
    # Build the application
    log "🏗️ Building application..." "$BLUE"
    NODE_ENV=production npm run build >> $DEPLOY_LOG 2>&1
    
    # Restart main application
    log "🔄 Restarting main application..." "$BLUE"
    pm2 reload partsfinda --update-env >> $DEPLOY_LOG 2>&1
    
    # Health check
    health_check
    
    # Manage worker
    manage_worker
    
    # Cleanup
    cleanup
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "✅ Deployment completed successfully in ${duration} seconds!" "$GREEN"
    log "📊 Deployment log: $DEPLOY_LOG" "$BLUE"
    
    # Send success notification
    send_notification "DEPLOYMENT_SUCCESS" "Deployed $commit_hash in ${duration}s - $commit_message"
}

# Usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -b, --branch BRANCH    Deploy specific branch (default: main)"
    echo "  -e, --env ENV          Set environment (default: production)"
    echo "  --no-worker            Skip worker management"
    echo "  --no-migrations        Skip database migrations"
    echo "  --no-backup           Skip backups"
    echo "  -h, --help            Show this help message"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -e|--env)
            NODE_ENV="$2"
            shift 2
            ;;
        --no-worker)
            ENABLE_WORKER=false
            shift
            ;;
        --no-migrations)
            RUN_MIGRATIONS=false
            shift
            ;;
        --no-backup)
            BACKUP_ENABLED=false
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            error_exit "Unknown option: $1"
            ;;
    esac
done

# Create deploy config file for future use
cat > $CONFIG_FILE << EOF
BRANCH="$BRANCH"
NODE_ENV="$NODE_ENV"
ENABLE_WORKER="$ENABLE_WORKER"
RUN_MIGRATIONS="$RUN_MIGRATIONS"
BACKUP_ENABLED="$BACKUP_ENABLED"
EOF

# Run deployment
trap 'error_exit "Deployment interrupted"' INT TERM
deploy