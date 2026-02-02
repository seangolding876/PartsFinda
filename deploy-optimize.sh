#!/bin/bash
set -e

echo "🚀 PARTSFINDA MANUAL DEPLOY WITH CACHE CLEANING"
echo "📅 Started at: $(date)"

# === COLOR CODES ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# === 0. CLEAR CACHE ===
echo -e "${YELLOW}🧹 Clearing cache...${NC}"
cd /var/www/partsfinda

# Remove Next.js cache
rm -rf .next/cache || true

# Remove npm cache (optional)
npm cache clean --force || true

# Clear node_modules/.cache
rm -rf node_modules/.cache || true

# Clear any other caches
rm -rf .cache || true
find . -name "*.log" -delete || true

echo -e "${GREEN}✅ Cache cleared${NC}"

# === 1. PULL LATEST CODE ===
echo -e "${YELLOW}📦 Pulling latest code...${NC}"
git fetch origin
git reset --hard origin/main
echo -e "${GREEN}✅ Code updated${NC}"

# === 2. CLEAN INSTALL ===
echo -e "${YELLOW}📦 Force reinstalling dependencies...${NC}"
rm -rf node_modules package-lock.json || true
npm ci --only=production --no-audit
echo -e "${GREEN}✅ Dependencies installed${NC}"

# === 3. BUILD APP ===
echo -e "${YELLOW}🏗️ Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Build completed${NC}"

# === 4. RESTART SERVICES ===
echo -e "${YELLOW}🔄 Restarting services...${NC}"
pm2 delete all || true
pm2 start npm --name "partsfinda" -- start
echo -e "${GREEN}✅ Services restarted${NC}"

# === 5. VERIFY ===
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED WITH CACHE CLEAR!${NC}"
echo "📊 Check status: pm2 status"
echo "📋 Check logs: pm2 logs"
echo "⏰ Finished at: $(date)"