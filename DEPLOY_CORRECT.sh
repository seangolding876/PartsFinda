#!/bin/bash

echo "==========================================="
echo "   PARTSFINDA DEPLOYMENT TO GITHUB        "
echo "==========================================="
echo ""
echo "Repository: github.com/seangolding876/PartsFinda"
echo ""
echo "You need a GitHub Personal Access Token:"
echo "1. Go to: https://github.com/settings/tokens"
echo "2. Click 'Generate new token (classic)'"
echo "3. Give it 'repo' permissions"
echo "4. Copy the token (starts with 'ghp_')"
echo ""
echo "==========================================="
echo ""

# Ask for the token
read -p "Please paste your GitHub token: " TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Error: No token provided"
    exit 1
fi

echo ""
echo "📦 Pushing to GitHub (seangolding876/PartsFinda)..."
echo ""

# Push to GitHub with the CORRECT username
git push https://${TOKEN}@github.com/seangolding876/PartsFinda.git main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub!"
    echo ""
    echo "🚀 WHAT HAPPENS NEXT:"
    echo "1. Check GitHub: https://github.com/seangolding876/PartsFinda"
    echo "2. Netlify will auto-deploy (if connected)"
    echo "3. Your site will be live at: https://partsfinda.com"
    echo ""
    echo "📊 Important Links:"
    echo "   - Your GitHub: https://github.com/seangolding876/PartsFinda"
    echo "   - Netlify: https://app.netlify.com"
    echo "   - Live Site: https://partsfinda.com"
    echo ""
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "1. Token is correct (starts with ghp_)"
    echo "2. Token has 'repo' permissions"
    echo ""
    echo "Try this manual command:"
    echo "git push https://YOUR_TOKEN@github.com/seangolding876/PartsFinda.git main --force"
    echo ""
fi
