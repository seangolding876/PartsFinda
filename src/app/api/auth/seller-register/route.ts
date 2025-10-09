import { NextRequest, NextResponse } from 'next/server';

// Mock seller database (in production, use Supabase)
const mockSellers: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      businessName,
      ownerName,
      phone,
      location,
      businessType,
      subscriptionTier
    } = body;

    // Validation
    if (!email || !password || !businessName || !ownerName || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate subscription tier
    const validTiers = ['basic', 'professional', 'enterprise'];
    if (subscriptionTier && !validTiers.includes(subscriptionTier.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Check if seller already exists (mock check)
    const existingSeller = mockSellers.find(s => s.email === email);
    if (existingSeller) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create seller (mock implementation)
    const newSeller = {
      id: `seller_${Date.now()}`,
      email,
      businessName,
      ownerName,
      phone,
      location: location || 'Kingston',
      businessType: businessType || 'auto-parts-store',
      subscriptionTier: subscriptionTier || 'basic',
      role: 'seller',
      verified: false,
      rating: 0,
      reviewCount: 0,
      salesCount: 0,
      createdAt: new Date().toISOString()
    };

    // In production, save to Supabase
    mockSellers.push(newSeller);

    // Generate auth token (mock)
    const authToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Seller account created successfully',
      authToken,
      seller: {
        id: newSeller.id,
        email: newSeller.email,
        businessName: newSeller.businessName,
        ownerName: newSeller.ownerName,
        role: newSeller.role,
        subscriptionTier: newSeller.subscriptionTier,
        verified: newSeller.verified
      }
    });

    // Set HTTP-only cookies for authentication
    response.cookies.set('auth-token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    response.cookies.set('user-role', 'seller', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    response.cookies.set('user-email', newSeller.email, {
      httpOnly: false, // Allow client access for display
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Seller registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
