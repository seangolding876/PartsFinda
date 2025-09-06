#!/bin/bash

echo "🔍 Checking PartsFinda Deployment Status..."
echo "========================================"

# Check if site is live
echo ""
echo "📡 Testing site connectivity..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://partsfinda.com)

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Site is LIVE at https://partsfinda.com"
    echo "   HTTP Status: $HTTP_STATUS"
else
    echo "❌ Site not accessible (HTTP Status: $HTTP_STATUS)"
    echo "   Possible reasons:"
    echo "   - Deployment still in progress"
    echo "   - DNS not propagated yet"
    echo "   - Build failed"
fi

echo ""
echo "🔗 Quick Links:"
echo "   🌐 Live Site: https://partsfinda.com"
echo "   📱 GitHub: https://github.com/3la2i/partsfinda"
echo "   🚀 Netlify: https://app.netlify.com"
echo "   🗄️  Supabase: https://supabase.com/dashboard"

echo ""
echo "📊 Next Steps:"
if [ "$HTTP_STATUS" = "200" ]; then
    echo "   1. ✅ Site is live - start testing features"
    echo "   2. 🗄️  Set up Supabase database (see SUPABASE_SETUP_GUIDE.md)"
    echo "   3. 🧪 Run feature tests (see TEST_LIVE_FEATURES.md)"
    echo "   4. 💳 Configure payment processing"
else
    echo "   1. ⏳ Wait 2-3 minutes for deployment"
    echo "   2. 🔍 Check Netlify deployment logs"
    echo "   3. 🔧 Verify GitHub push was successful"
    echo "   4. 🔄 Try running this script again"
fi

echo ""
echo "🆘 Need help?"
echo "   - Check deployment logs in Netlify"
echo "   - Verify GitHub repository has latest code"
echo "   - Review PRODUCTION_DEPLOYMENT.md for troubleshooting"
