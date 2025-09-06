#!/bin/bash

echo "====================================="
echo "   🔧 PartsFinda Push Fix"
echo "====================================="
echo ""
echo "Let's fix the authentication issue..."
echo ""

# First, let's unset any credential helpers that might be interfering
git config --unset credential.helper 2>/dev/null

echo "Please enter your GitHub token:"
echo "(It starts with ghp_)"
echo ""
read -p "Token: " TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ No token entered"
    exit 1
fi

echo "📤 Attempting to push your code..."
echo ""

# Method 1: Try with the token directly
echo "Method 1: Direct push..."
git push https://${TOKEN}@github.com/seangolding876/PartsFinda.git master:main 2>&1 | grep -v "Password" &

# Wait a moment
sleep 2

# If that doesn't work, try this
if [ $? -ne 0 ]; then
    echo ""
    echo "Method 2: Force push..."
    git push -f https://${TOKEN}@github.com/seangolding876/PartsFinda.git HEAD:main 2>&1 | grep -v "Password" &
    sleep 2
fi

# Final method
if [ $? -ne 0 ]; then
    echo ""
    echo "Method 3: Using different branch..."
    git branch -M main
    git push -u https://${TOKEN}@github.com/seangolding876/PartsFinda.git main 2>&1 | grep -v "Password"
fi

echo ""
echo "✅ Push attempted. Check results above."
echo ""
echo "If successful, your site will deploy to partsfinda.com in 5-10 minutes!"
