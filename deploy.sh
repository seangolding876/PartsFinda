#!/bin/bash

echo "====================================="
echo "   🚀 Deploy PartsFinda to GitHub"
echo "====================================="
echo ""
echo "Your project is ready to deploy!"
echo ""
echo "Please enter your GitHub token:"
echo "(It starts with ghp_)"
echo ""
read -s -p "Token: " TOKEN
echo ""
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ No token entered"
    exit 1
fi

echo "📤 Pushing to GitHub..."
echo ""

# Try to push
if git push -f https://${TOKEN}@github.com/seangolding876/PartsFinda.git master:main; then
    echo ""
    echo "✅ SUCCESS! Your code has been pushed to GitHub!"
    echo ""
    echo "📋 What happens next:"
    echo "1. Netlify will detect the changes (1-2 minutes)"
    echo "2. Netlify will build your site (3-5 minutes)"
    echo "3. Your site will be live at partsfinda.com"
    echo ""
    echo "🔍 Check deployment status at:"
    echo "   https://app.netlify.com"
    echo ""
    echo "🌐 Your site will be live at:"
    echo "   https://partsfinda.com"
    echo ""
else
    echo ""
    echo "❌ Push failed. Please check your token and try again."
    echo "Get a new token at: https://github.com/settings/tokens/new"
fi
