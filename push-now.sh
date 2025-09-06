#!/bin/bash

echo "====================================="
echo "   🚀 Push PartsFinda to GitHub"
echo "====================================="
echo ""
echo "Enter your GitHub token (starts with ghp_):"
echo ""
read -p "Token: " TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ No token entered"
    exit 1
fi

# Build the URL properly
REPO_URL="https://${TOKEN}@github.com/seangolding876/PartsFinda.git"

echo "📤 Pushing to GitHub..."
echo ""

# Push directly without using remote
git push "${REPO_URL}" master:main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Your site will be live soon!"
    echo ""
    echo "📋 Check these:"
    echo "1. GitHub: https://github.com/seangolding876/PartsFinda"
    echo "2. Netlify: https://app.netlify.com"
    echo "3. Your site: https://partsfinda.com (in 5-10 minutes)"
else
    echo ""
    echo "❌ Push failed. Try this manually:"
    echo ""
    echo "git push https://YOUR_TOKEN@github.com/seangolding876/PartsFinda.git master:main"
fi
