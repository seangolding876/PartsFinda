#!/bin/bash

echo "==========================================="
echo "   PARTSFINDA DEPLOYMENT (FIXED)          "
echo "==========================================="
echo ""
echo "Repository: github.com/3la2i/PartsFinda"
echo "(Note: PartsFinda with capital P and F)"
echo ""
echo "Before continuing, you need:"
echo "1. GitHub Personal Access Token"
echo "   Get it at: https://github.com/settings/tokens"
echo "   Must have 'repo' permissions"
echo ""
echo "==========================================="
echo ""

# Ask for the token
read -p "Please paste your GitHub token (starts with ghp_): " TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Error: No token provided"
    exit 1
fi

echo ""
echo "📦 Pushing to GitHub (PartsFinda repository)..."
echo ""

# Push to GitHub with the correct repository name
git push https://${TOKEN}@github.com/3la2i/PartsFinda.git main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub!"
    echo ""
    echo "🚀 NEXT STEPS:"
    echo "1. Check GitHub: https://github.com/3la2i/PartsFinda"
    echo "2. Netlify will auto-deploy in 3-5 minutes"
    echo "3. Your site will be live at: https://partsfinda.com"
    echo ""
    echo "📊 To check deployment status:"
    echo "   - Netlify Dashboard: https://app.netlify.com"
    echo "   - GitHub Repo: https://github.com/3la2i/PartsFinda"
    echo ""
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "1. Is your token correct?"
    echo "2. Does it have 'repo' permissions?"
    echo "3. Try the manual command below:"
    echo ""
    echo "Manual push command:"
    echo "git push https://YOUR_TOKEN@github.com/3la2i/PartsFinda.git main --force"
    echo ""
fi
