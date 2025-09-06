#!/bin/bash

echo "=================================="
echo "   GITHUB TOKEN TEST             "
echo "=================================="
echo ""
echo "This will test if your token works"
echo ""

read -p "Paste your GitHub token: " TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ No token provided"
    exit 1
fi

echo ""
echo "Testing connection to GitHub..."

# Test the token by accessing the repo
curl -s -H "Authorization: token $TOKEN" https://api.github.com/repos/3la2i/partsfinda > /tmp/test_result.json

if grep -q '"name":"partsfinda"' /tmp/test_result.json; then
    echo "✅ SUCCESS! Your token works!"
    echo ""
    echo "You can now run: ./DEPLOY_TO_GITHUB.sh"
else
    echo "❌ Token test failed. Please check:"
    echo "1. Token is correct (starts with ghp_)"
    echo "2. Token has 'repo' permissions"
    echo "3. Token hasn't expired"
fi

rm -f /tmp/test_result.json
