import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let usersQuery = `
      SELECT 
        id, email, name, role, phone, email_verified, created_at,
        avg_rating, total_ratings, business_name, owner_name, business_type,
        verified_status
      FROM users
    `;

    const params = [];
    if (role && role !== 'admin') {
      usersQuery += ` WHERE role = $1`;
      params.push(role);
    } else if (role === 'admin') {
      usersQuery += ` WHERE role = $1`;
      params.push('admin');
    }

    usersQuery += ` ORDER BY created_at DESC`;

    const usersResult = await query(usersQuery, params);

    return NextResponse.json({
      success: true,
      data: usersResult.rows,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, role } = body;

    // Basic validation
    if (!name || !email || !password || !role) {
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

    // Simple password length check (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password before storing
    // console.log('🔐 Hashing password for new user...');
    const hashedPassword = await hashPassword(password);

    // For admin users, no email verification needed
    const result = await query(
      `INSERT INTO users (name, email, password, phone, role, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, phone, created_at`,
      [name, email.toLowerCase(), hashedPassword, phone, role, true]
    );

    // console.log('✅ Admin user created successfully with ID:', result.rows[0].id);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'User created successfully'
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // More specific error messages
    let errorMessage = 'Failed to create user';
    if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
      errorMessage = 'User with this email already exists';
    } else if (error.message.includes('password')) {
      errorMessage = 'Error processing password';
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}