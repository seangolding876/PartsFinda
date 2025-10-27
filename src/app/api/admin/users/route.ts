import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
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

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // For admin users, no email verification needed
    const result = await query(
      `INSERT INTO users (name, email, password, phone, role, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, phone, created_at`,
      [name, email, password, phone, role, true] // email_verified = true for admin
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'User created successfully'
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}