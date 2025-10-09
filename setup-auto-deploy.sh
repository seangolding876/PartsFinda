#!/bin/bash

# PartsFinda Auto-Deploy Setup Script
# This script automates GitHub connection and Netlify auto-deploy setup

echo "🚀 PartsFinda Auto-Deploy Setup"
echo "======================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository. Please run from the partsfinda directory."
    exit 1
fi

# Check if there are any remotes
EXISTING_REMOTE=$(git remote get-url origin 2>/dev/null)
if [ ! -z "$EXISTING_REMOTE" ]; then
    echo "⚠️  Found existing remote: $EXISTING_REMOTE"
    echo "Do you want to replace it? (y/n):"
    read REPLACE
    if [ "$REPLACE" = "y" ] || [ "$REPLACE" = "Y" ]; then
        git remote remove origin
        echo "✅ Removed existing remote"
    else
        echo "❌ Keeping existing remote. Exiting."
        exit 1
    fi
fi

echo "📝 Please provide your GitHub details:"
echo ""

# Get GitHub username
echo "Enter your GitHub username:"
read USERNAME
if [ -z "$USERNAME" ]; then
    echo "❌ Username cannot be empty"
    exit 1
fi

# Get repository name
echo "Enter your repository name (default: partsfinda-marketplace):"
read REPO
if [ -z "$REPO" ]; then
    REPO="partsfinda-marketplace"
fi

# Ask about authentication method
echo ""
echo "Choose authentication method:"
echo "1) HTTPS with Personal Access Token (Recommended)"
echo "2) HTTPS (will prompt for password)"
echo "Enter choice (1 or 2):"
read AUTH_METHOD

if [ "$AUTH_METHOD" = "1" ]; then
    echo ""
    echo "📋 To create a Personal Access Token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Select 'repo' scope"
    echo "4. Copy the generated token"
    echo ""
    echo "Enter your Personal Access Token:"
    read -s TOKEN
    if [ -z "$TOKEN" ]; then
        echo "❌ Token cannot be empty"
        exit 1
    fi
    REMOTE_URL="https://$TOKEN@github.com/$USERNAME/$REPO.git"
else
    REMOTE_URL="https://github.com/$USERNAME/$REPO.git"
fi

echo ""
echo "🔗 Setting up GitHub remote..."
echo "Repository: $USERNAME/$REPO"

# Add remote
git remote add origin "$REMOTE_URL"
if [ $? -eq 0 ]; then
    echo "✅ Remote added successfully"
else
    echo "❌ Failed to add remote"
    exit 1
fi

# Push to GitHub
echo ""
echo "📤 Pushing Version 65 to GitHub..."
echo "This will trigger auto-deploy if Netlify is connected."

git push -u origin master
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Code pushed to GitHub!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to: https://app.netlify.com"
    echo "2. Click 'New site from Git'"
    echo "3. Choose 'GitHub'"
    echo "4. Select repository: $USERNAME/$REPO"
    echo "5. Use these build settings:"
    echo "   - Build command: npm ci && npm run build"
    echo "   - Publish directory: .next"
    echo "6. Click 'Deploy site'"
    echo ""
    echo "🔧 Don't forget to add environment variables in Netlify:"
    echo "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo ""
    echo "🌐 Your marketplace will be live with auto-deploy!"
else
    echo "❌ Failed to push to GitHub"
    echo ""
    echo "🔧 Common issues:"
    echo "1. Repository doesn't exist - create it at: https://github.com/new"
    echo "2. Authentication failed - check your token/credentials"
    echo "3. Repository is private - make it public for free Netlify deploy"
    exit 1
fi

echo ""
echo "✅ Auto-deploy setup complete!"
echo "🔗 Repository URL: https://github.com/$USERNAME/$REPO"
