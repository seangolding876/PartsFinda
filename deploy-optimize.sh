#!/bin/bash
set -e

echo "🚀 PARTSFINDA MANUAL DEPLOY"
echo "📅 Started at: $(date)"

# === COLOR CODES ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd /var/www/partsfinda

# === 0. CLEAR CACHE & OLD BUILD ===
echo -e "${YELLOW}🧹 Clearing cache & old build...${NC}"

# Next.js build & cache
rm -rf .next || true

# Node cache
rm -rf node_modules/.cache || true

# Generic caches / logs
rm -rf .cache || true
find . -name "*.log" -delete || true

echo -e "${GREEN}✅ Cache & old build cleared${NC}"

# === 1. PULL LATEST CODE ===
echo -e "${YELLOW}📦 Pulling latest code...${NC}"
git fetch origin
git reset --hard origin/main
echo -e "${GREEN}✅ Code updated${NC}"

# === 2. CHECK FOR PACKAGE CHANGES ===
echo -e "${YELLOW}🔍 Checking for dependency changes...${NC}"
if git diff --name-only HEAD~1 HEAD | grep -q "package.json\|package-lock.json"; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm ci --only=production --no-audit
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}⚡ No dependency changes, skipping install${NC}"
fi

# === 3. BUILD APP (FRESH BUILD) ===
echo -e "${YELLOW}🏗️ Building application (fresh)...${NC}"
npm run build
echo -e "${GREEN}✅ Build completed${NC}"

# === 4. RESTART SERVICES ===
echo -e "${YELLOW}🔄 Restarting services...${NC}"
pm2 reload all --update-env
echo -e "${GREEN}✅ Services restarted${NC}"

# === 5. VERIFY ===
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo "📊 Check status: pm2 status"
echo "📋 Check logs: pm2 logs"
echo "⏰ Finished at: $(date)"
