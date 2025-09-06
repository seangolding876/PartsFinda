#!/bin/bash

echo "==========================================="
echo "   PARTSFINDA DEPLOYMENT TO GITHUB        "
echo "==========================================="
echo ""
echo "This script will push your code to GitHub."
echo ""
echo "BEFORE YOU START:"
echo "1. You need a GitHub Personal Access Token"
echo "2. Go to: https://github.com/settings/tokens"
echo "3. Click 'Generate new token (classic)'"
echo "4. Give it 'repo' permissions"
echo "5. Copy the token (it starts with 'ghp_')"
echo ""
echo "==========================================="
echo ""

# Ask for the token
read -p "Please paste your GitHub token here: " TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Error: No token provided"
    exit 1
fi

echo ""
echo "📦 Pushing to GitHub..."
echo ""

# Push to GitHub with the token
git push https://${TOKEN}@github.com/3la2i/partsfinda.git main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub!"
    echo ""
    echo "🚀 NEXT STEPS:"
    echo "1. Go to https://app.netlify.com"
    echo "2. Check if deployment has started"
    echo "3. Your site will be live at: https://partsfinda.com"
    echo ""
    echo "If Netlify doesn't auto-deploy:"
    echo "1. Go to Netlify > Site Settings > Build & Deploy"
    echo "2. Click 'Trigger Deploy'"
    echo ""
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "1. Is your token correct?"
    echo "2. Does it have 'repo' permissions?"
    echo "3. Try generating a new token"
    echo ""
fi
