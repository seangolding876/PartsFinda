import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const environment = process.env.NODE_ENV || 'development';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'Not configured';

    // Stripe configuration check
    const hasStripeSecret = !!process.env.STRIPE_SECRET_KEY &&
                            process.env.STRIPE_SECRET_KEY !== 'YOUR_STRIPE_SECRET_KEY_key';
    const hasStripePublishable = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
                                process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY !== 'YOUR_STRIPE_PUBLISHABLE_KEY';
    const stripeConfigured = hasStripeSecret && hasStripePublishable;

    // Supabase configuration check
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
                           process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-supabase-url';
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-anon-key';
    const supabaseConfigured = hasSupabaseUrl && hasSupabaseKey;

    // Email service check
    const emailConfigured = !!process.env.RESEND_API_KEY &&
                            process.env.RESEND_API_KEY !== 'your_resend_api_key';

    // File storage check
    const cloudinaryConfigured = !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
                                 process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_name';

    // Calculate deployment readiness
    const coreFeatures = {
      website: true, // Always true - static site works
      payments: stripeConfigured,
      database: supabaseConfigured,
      email: emailConfigured,
      fileStorage: cloudinaryConfigured,
    };

    const deploymentScore = Object.values(coreFeatures).filter(Boolean).length;
    const totalFeatures = Object.keys(coreFeatures).length;
    const readinessPercentage = Math.round((deploymentScore / totalFeatures) * 100);

    // Determine deployment status
    let deploymentStatus: 'ready' | 'partial' | 'basic';
    let statusMessage: string;

    if (deploymentScore >= 4) {
      deploymentStatus = 'ready';
      statusMessage = '🚀 Full marketplace ready for business operations';
    } else if (deploymentScore >= 2) {
      deploymentStatus = 'partial';
      statusMessage = '⚡ Core features ready, optional services can be added';
    } else {
      deploymentStatus = 'basic';
      statusMessage = '📱 Basic website ready, configure services for full functionality';
    }

    return NextResponse.json({
      success: true,
      deployment: {
        status: deploymentStatus,
        message: statusMessage,
        readiness: `${readinessPercentage}%`,
        score: `${deploymentScore}/${totalFeatures}`,
        environment,
        siteUrl,
        timestamp: new Date().toISOString(),
      },
      services: {
        website: {
          configured: true,
          status: '✅ Active',
          description: 'Professional marketplace with Jamaica branding',
          features: [
            'Mobile-responsive design',
            'VIN decoder integration',
            'Professional homepage',
            'Contact forms',
            'Navigation and routing'
          ]
        },
        payments: {
          configured: stripeConfigured,
          status: stripeConfigured ? '✅ Active' : '⚠️ Mock Mode',
          description: stripeConfigured
            ? 'Live payment processing with Stripe'
            : 'Configure STRIPE_SECRET_KEY for live payments',
          features: stripeConfigured ? [
            'Real payment processing',
            'Secure checkout',
            'Transaction fees (3%)',
            'Refund handling',
            'Subscription billing'
          ] : [
            'Mock payment demonstrations',
            'Payment flow testing',
            'UI/UX validation'
          ]
        },
        database: {
          configured: supabaseConfigured,
          status: supabaseConfigured ? '✅ Active' : '⚠️ Mock Mode',
          description: supabaseConfigured
            ? 'Full database with user management'
            : 'Configure Supabase for user accounts and data storage',
          features: supabaseConfigured ? [
            'User authentication',
            'Supplier profiles',
            'Order tracking',
            'Admin dashboard',
            'Real-time messaging'
          ] : [
            'Static content',
            'Form validations',
            'UI demonstrations'
          ]
        },
        email: {
          configured: emailConfigured,
          status: emailConfigured ? '✅ Active' : '⚠️ Not Configured',
          description: emailConfigured
            ? 'Email notifications with Resend'
            : 'Configure RESEND_API_KEY for email notifications',
          features: emailConfigured ? [
            'Order confirmations',
            'Supplier notifications',
            'Customer support emails',
            'Marketing campaigns'
          ] : ['Contact form submissions (basic)']
        },
        fileStorage: {
          configured: cloudinaryConfigured,
          status: cloudinaryConfigured ? '✅ Active' : '⚠️ Not Configured',
          description: cloudinaryConfigured
            ? 'Image storage with Cloudinary'
            : 'Configure Cloudinary for image uploads',
          features: cloudinaryConfigured ? [
            'Part image uploads',
            'Profile pictures',
            'Document storage',
            'Image optimization'
          ] : ['Static placeholder images']
        }
      },
      businessReadiness: {
        canAcceptOrders: stripeConfigured,
        canManageUsers: supabaseConfigured,
        canSendEmails: emailConfigured,
        canStoreImages: cloudinaryConfigured,
        marketingReady: true, // Static site is always marketing ready
        seoOptimized: true,
        mobileOptimized: true,
        securityEnabled: true,
      },
      nextSteps: getNextSteps(deploymentScore, {
        stripe: stripeConfigured,
        supabase: supabaseConfigured,
        email: emailConfigured,
        cloudinary: cloudinaryConfigured,
      }),
    });

  } catch (error) {
    console.error('Deployment status check failed:', error);

    return NextResponse.json({
      success: false,
      deployment: {
        status: 'error',
        message: '❌ Deployment status check failed',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
    }, { status: 500 });
  }
}

function getNextSteps(score: number, services: Record<string, boolean>) {
  const steps: string[] = [];

  if (score === 5) {
    steps.push('🎉 All services configured! Start marketing your marketplace');
    steps.push('📊 Monitor user engagement and payment analytics');
    steps.push('🌐 Consider custom domain for professional branding');
    return steps;
  }

  if (!services.stripe) {
    steps.push('💳 Configure Stripe for live payment processing');
  }

  if (!services.supabase) {
    steps.push('🗄️ Set up Supabase for user accounts and data storage');
  }

  if (!services.email) {
    steps.push('📧 Add Resend for email notifications');
  }

  if (!services.cloudinary) {
    steps.push('📷 Configure Cloudinary for image uploads');
  }

  if (score >= 2) {
    steps.push('🚀 Ready to launch! Core features are working');
  }

  return steps;
}
