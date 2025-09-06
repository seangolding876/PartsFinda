#!/bin/bash

echo "====================================="
echo "   🚀 Simple Push to GitHub"
echo "====================================="
echo ""
echo "This will push your code without password prompts"
echo ""
echo "Enter your GitHub token (starts with ghp_):"
read -p "Token: " TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ No token entered"
    exit 1
fi

# Disable password prompts
export GIT_ASKPASS=echo
export GIT_TERMINAL_PROMPT=0

echo "📤 Pushing to GitHub (no password needed)..."
echo ""

# Push without allowing password prompts
timeout 10 git push https://${TOKEN}@github.com/seangolding876/PartsFinda.git master:main 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Check Netlify: https://app.netlify.com"
    echo "2. Wait 5-10 minutes for build"
    echo "3. Visit: https://partsfinda.com"
else
    echo ""
    echo "If this didn't work, try the manual method:"
    echo ""
    echo "1. Copy this command (replace YOUR_TOKEN):"
    echo "   git push https://YOUR_TOKEN@github.com/seangolding876/PartsFinda.git master:main"
    echo ""
    echo "2. When it asks for password, just press Enter (leave it blank)"
    echo ""
    echo "OR get a new token at:"
    echo "https://github.com/settings/tokens/new"
    echo "Make sure to check the 'repo' checkbox!"
fi
