#!/bin/bash

echo "🚀 Auto-Deploying PartsFinda..."
echo ""
echo "Enter your GitHub token (starts with ghp_):"
read -s TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ No token entered"
    exit 1
fi

echo "📤 Pushing fixed configuration to GitHub..."
git push -f https://${TOKEN}@github.com/seangolding876/PartsFinda.git master:main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Fixed code pushed to GitHub!"
    echo ""
    echo "📊 What happens next:"
    echo "• Netlify will detect changes (1-2 min)"
    echo "• Build will start with fixed config (2-3 min)"
    echo "• Site will be live at partsfinda.com (5-7 min)"
    echo ""
    echo "🔍 Monitor at: https://app.netlify.com"
else
    echo "❌ Push failed. Check your token."
fi
