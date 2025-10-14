import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 🔹 GET USER PROFILE
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

    const userResult = await query(
      `SELECT id, name, email, role, phone FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: userResult.rows[0] });
  } catch (error: any) {
    console.error('❌ GET /profile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 🔹 UPDATE USER PROFILE
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

    const { name, phone, password } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: 'Name and phone are required' }, { status: 400 });
    }

    let queryText = `UPDATE users SET name = $1, phone = $2`;
    const params: any[] = [name, phone];

    if (password && password.trim() !== '') {
      const hashed = await bcrypt.hash(password, 10);
      queryText += `, password = $3 WHERE id = $4`;
      params.push(hashed, userId);
    } else {
      queryText += ` WHERE id = $3`;
      params.push(userId);
    }

    await query(queryText, params);

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('❌ PUT /profile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
