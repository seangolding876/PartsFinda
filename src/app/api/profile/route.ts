import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 🔹 GET COMPREHENSIVE USER PROFILE
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 401 });
    }

    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Invalid token payload' }, { status: 400 });
    }

    // Complete user data with subscription info
    const userResult = await query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.phone, 
        u.owner_name, u.business_name, u.business_type,
        u.business_registration_number, u.tax_id,
        u.years_in_business, u.address, u.parish, u.city,
        u.postal_code, u.business_phone, u.business_email,
        u.website, u.specializations, u.vehicle_brands,
        u.part_categories, u.membership_plan,
        u.avg_rating, u.total_ratings, u.verified_status,
        u.profile_completion_percentage, u.bio,
         'https://media.istockphoto.com/id/1257558676/vector/buyer-avatar-icon.jpg?s=170667a&w=0&k=20&c=VG92-sJeQVUZaZO9cRgBHwnUTVRTDD252tM8z-dYyzA'as avatar_url , u.cover_image_url,
        u.notification_settings, u.preferences,
        u.social_links, u.language_preference, u.timezone,
        u.created_at, u.last_login,
        ss.plan_name as subscription_plan,
        ss.start_date as subscription_start,
        ss.end_date as subscription_end,
        ss.is_active as subscription_active
       FROM users u
       LEFT JOIN supplier_subscription ss ON u.id = ss.user_id AND ss.is_active = true
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userData = userResult.rows[0];
    
    // Calculate profile completion percentage if not set
    if (!userData.profile_completion_percentage) {
      const completion = calculateProfileCompletion(userData);
      await query(
        'UPDATE users SET profile_completion_percentage = $1 WHERE id = $2',
        [completion, userId]
      );
      userData.profile_completion_percentage = completion;
    }

    return NextResponse.json({ 
      success: true, 
      data: userData 
    });
  } catch (error: any) {
    console.error('❌ GET /profile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 🔹 UPDATE COMPREHENSIVE USER PROFILE
export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 401 });
    }

    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Invalid token payload' }, { status: 400 });
    }

    const { 
      name, phone, password, 
      bio, business_name, business_phone,
      address, parish, city, website,
      notification_settings, preferences,
      social_links, language_preference, timezone
    } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: 'Name and phone are required' }, { status: 400 });
    }

    let queryText = `
      UPDATE users SET 
        name = $1, phone = $2, bio = $3,
        business_name = $4, business_phone = $5,
        address = $6, parish = $7, city = $8,
        website = $9, notification_settings = $10,
        preferences = $11, social_links = $12,
        language_preference = $13, timezone = $14,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    const params: any[] = [
      name, phone, bio || null,
      business_name || null, business_phone || null,
      address || null, parish || null, city || null,
      website || null, 
      notification_settings ? JSON.stringify(notification_settings) : '{}',
      preferences ? JSON.stringify(preferences) : '{}',
      social_links ? JSON.stringify(social_links) : '{}',
      language_preference || 'en',
      timezone || 'UTC'
    ];

    if (password && password.trim() !== '') {
      const hashed = await bcrypt.hash(password, 10);
      queryText += `, password = $15, last_password_change = CURRENT_TIMESTAMP WHERE id = $16`;
      params.push(hashed, userId);
    } else {
      queryText += ` WHERE id = $15`;
      params.push(userId);
    }

    await query(queryText, params);

    // Recalculate profile completion
    const completionResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    const completion = calculateProfileCompletion(completionResult.rows[0]);
    await query(
      'UPDATE users SET profile_completion_percentage = $1 WHERE id = $2',
      [completion, userId]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      profile_completion: completion 
    });
  } catch (error: any) {
    console.error('❌ PUT /profile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(user: any): number {
  let completedFields = 0;
  const totalFields = 15; // Adjust based on important fields

  const importantFields = [
    'name', 'email', 'phone', 'business_name', 
    'business_phone', 'address', 'city', 'parish',
    'business_type', 'bio', 'website', 'avatar_url',
    'specializations', 'vehicle_brands', 'part_categories'
  ];

  importantFields.forEach(field => {
    if (user[field] && user[field].toString().trim() !== '') {
      completedFields++;
    }
  });

  return Math.round((completedFields / totalFields) * 100);
}