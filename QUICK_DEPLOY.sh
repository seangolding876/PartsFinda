#!/bin/bash

echo "======================================"
echo "  PARTSFINDA QUICK DEPLOYMENT"
echo "======================================"
echo ""
echo "This script will push your code to GitHub"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Initializing now..."
    git init
    git branch -m main
    git config user.email "developer@partsfinda.com"
    git config user.name "PartsFinda Developer"
    git add -A
    git commit -m "Initial commit: Complete PartsFinda marketplace"
fi

echo "📋 IMPORTANT: Make sure you have:"
echo "1. Created the repository at: https://github.com/new"
echo "   - Repository name: partsfinda"
echo "   - Leave it empty (no README)"
echo "2. Generated a GitHub token with 'repo' permissions"
echo ""
read -p "Have you created the repository? (y/n): " REPO_CREATED

if [ "$REPO_CREATED" != "y" ]; then
    echo ""
    echo "Please create the repository first:"
    echo "1. Go to: https://github.com/new"
    echo "2. Name it: partsfinda"
    echo "3. Make it public"
    echo "4. Don't add any files"
    echo "5. Click 'Create repository'"
    exit 1
fi

echo ""
read -p "Enter your GitHub token (starts with ghp_): " TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ No token provided"
    exit 1
fi

echo ""
echo "🚀 Pushing to GitHub..."

# Remove existing remote if it exists
git remote remove origin 2>/dev/null

# Add the remote with token
git remote add origin https://${TOKEN}@github.com/3la2i/partsfinda.git

# Push to GitHub
git push -u origin main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub!"
    echo ""
    echo "📊 What happens next:"
    echo "1. Netlify will detect the push"
    echo "2. Build will start automatically"
    echo "3. Site will be live in 3-5 minutes"
    echo ""
    echo "🔗 Check these links:"
    echo "   GitHub: https://github.com/3la2i/partsfinda"
    echo "   Netlify: https://app.netlify.com"
    echo "   Live Site: https://partsfinda.com"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo "1. Repository doesn't exist - create it at GitHub"
    echo "2. Token is incorrect - check it starts with ghp_"
    echo "3. Token lacks permissions - needs 'repo' scope"
fi
