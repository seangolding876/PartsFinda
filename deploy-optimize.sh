#!/bin/bash
set -e

echo "🚀 PARTSFINDA MANUAL DEPLOY"
echo "📅 Started at: $(date)"

# === COLORS ===
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd /var/www/partsfinda

# === 0. CLEAR CACHE & OLD BUILD ===
echo -e "${YELLOW}🧹 Clearing cache & old build...${NC}"
rm -rf .next || true
rm -rf node_modules/.cache || true
rm -rf .cache || true
find . -name "*.log" -delete || true
echo -e "${GREEN}✅ Cache cleared${NC}"

# === 1. PULL LATEST CODE ===
echo -e "${YELLOW}📦 Pulling latest code...${NC}"
git fetch origin
git reset --hard origin/main
echo -e "${GREEN}✅ Code updated${NC}"

# === 2. INSTALL DEPENDENCIES (SAFE MODE) ===
echo -e "${YELLOW}📦 Installing dependencies (production)...${NC}"
npm install --omit=dev --no-audit --legacy-peer-deps
echo -e "${GREEN}✅ Dependencies installed${NC}"

# === 3. BUILD ===
echo -e "${YELLOW}🏗️ Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Build completed${NC}"

# === 4. RESTART ===
echo -e "${YELLOW}🔄 Restarting services...${NC}"
pm2 reload all --update-env
echo -e "${GREEN}✅ Services restarted${NC}"

echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo "⏰ Finished at: $(date)"
