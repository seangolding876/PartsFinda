import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Predefined admin accounts for immediate access
const adminAccounts = [
  {
    email: 'admin@partsfinda.com',
    password: 'admin123',
    name: 'PartsFinda Admin',
    role: 'admin'
  },
  {
    email: 'support@partsfinda.com',
    password: 'support123',
    name: 'Support Team',
    role: 'admin'
  }
];

// Test accounts for demo purposes
const testAccounts = [
  {
    email: 'buyer@test.com',
    password: 'password123',
    name: 'Test Buyer',
    role: 'buyer'
  },
  {
    email: 'seller@test.com',
    password: 'password123',
    name: 'Test Seller',
    role: 'seller'
  },
  {
    email: 'customer@partsfinda.com',
    password: 'customer123',
    name: 'Demo Customer',
    role: 'buyer'
  },
  {
    email: 'supplier@partsfinda.com',
    password: 'supplier123',
    name: 'Demo Supplier',
    role: 'seller'
  }
];

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login attempt started...');

    const body = await request.json();
    const { email, password } = body;

    console.log('📧 Login attempt for:', email);

    // Validation
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password length validation
    if (password.length < 6) {
      console.log('❌ Password too short');
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    let user = null;

    // Check admin accounts first
    console.log('🔍 Checking admin accounts...');
    const adminUser = adminAccounts.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (adminUser) {
      console.log('✅ Admin user found:', adminUser.email);
      user = {
        id: `admin_${Date.now()}`,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      };
    }

    // Check test accounts
    if (!user) {
      console.log('🔍 Checking test accounts...');
      const testUser = testAccounts.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (testUser) {
        console.log('✅ Test user found:', testUser.email);
        user = {
          id: `test_${Date.now()}`,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role
        };
      }
    }

    // Try Supabase authentication if available
    if (!user) {
      console.log('🔍 Trying Supabase authentication...');
      try {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authData.user && !error) {
          console.log('✅ Supabase user found');
          user = {
            id: authData.user.id,
            email: authData.user.email || email,
            name: authData.user.user_metadata?.name || email.split('@')[0],
            role: authData.user.user_metadata?.role || 'buyer'
          };
        } else if (error) {
          console.log('⚠️ Supabase auth error:', error.message);
        }
      } catch (supabaseError) {
        console.log('⚠️ Supabase not available, continuing with fallback...');
      }
    }

    // If no existing account found, create new account for business demo
    if (!user) {
      console.log('🆕 Creating new user account...');
      const name = email.split('@')[0].replace(/[^a-zA-Z\s]/g, ' ').trim() || 'New User';
      const role = email.toLowerCase().includes('seller') || email.toLowerCase().includes('supplier') ? 'seller' : 'buyer';

      user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        role
      };

      console.log('✅ New user created:', { email: user.email, role: user.role });

      // Try to create account in Supabase if available
      try {
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: user.name,
              role: user.role
            }
          }
        });
        console.log('✅ User registered in Supabase');
      } catch (supabaseError) {
        console.log('⚠️ Supabase registration skipped (demo mode)');
      }
    }

    if (!user) {
      console.log('❌ Authentication failed - no user found');
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate auth token
    const authToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('✅ Login successful for:', user.email, 'Role:', user.role);

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      authToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    // Set cookies for authentication (production-compatible)
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: false, // Allow client access
      secure: isProduction, // Secure in production
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    };

    response.cookies.set('auth-token', authToken, cookieOptions);
    response.cookies.set('user-role', user.role, cookieOptions);
    response.cookies.set('user-email', user.email, cookieOptions);
    response.cookies.set('user-name', user.name, cookieOptions);

    console.log('✅ Cookies set for user:', user.email);

    return response;

  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
