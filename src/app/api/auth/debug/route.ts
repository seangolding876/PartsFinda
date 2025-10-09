import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Available test accounts
    const availableAccounts = [
      {
        category: 'Admin Accounts',
        accounts: [
          { email: 'admin@partsfinda.com', password: 'admin123', role: 'admin' },
          { email: 'support@partsfinda.com', password: 'support123', role: 'admin' }
        ]
      },
      {
        category: 'Demo Accounts',
        accounts: [
          { email: 'customer@partsfinda.com', password: 'customer123', role: 'buyer' },
          { email: 'supplier@partsfinda.com', password: 'supplier123', role: 'seller' },
          { email: 'buyer@test.com', password: 'password123', role: 'buyer' },
          { email: 'seller@test.com', password: 'password123', role: 'seller' }
        ]
      }
    ];

    // System status
    const systemStatus = {
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      authEndpoint: '/api/auth/login',
      cookiesEnabled: true,
      supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      features: {
        adminDashboard: '/admin/dashboard',
        sellerDashboard: '/seller/dashboard',
        buyerDashboard: '/my-requests',
        supplierSignup: '/auth/seller-signup'
      }
    };

    return NextResponse.json({
      success: true,
      message: '🔐 PartsFinda Authentication Debug',
      systemStatus,
      availableAccounts,
      instructions: {
        login: 'Use POST /api/auth/login with email and password',
        testPage: '/test-login for comprehensive testing',
        autoAccount: 'Any email + password (6+ chars) creates new account automatically'
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug API failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}
