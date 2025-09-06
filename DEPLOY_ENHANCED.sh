#!/bin/bash

echo "🚀 Deploy Enhanced PartsFinda with All Features"
echo "=============================================="
echo ""
echo "New Features:"
echo "✅ Messaging System"
echo "✅ Shopping Cart"
echo "✅ User Profile"
echo "✅ Enhanced UI"
echo ""
echo "Enter your GitHub token:"
read -s TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ No token entered"
    exit 1
fi

echo "📤 Deploying enhanced version..."
git push -f https://${TOKEN}@github.com/seangolding876/PartsFinda.git master:main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ENHANCED VERSION DEPLOYED!"
    echo ""
    echo "New features will be live at partsfinda.com in 5-10 minutes:"
    echo "• Messaging between buyers and sellers"
    echo "• Shopping cart functionality"
    echo "• User profiles"
    echo "• And more!"
else
    echo "❌ Push failed"
fi
