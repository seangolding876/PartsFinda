import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Token, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if reset token is valid
    const userResult = await query(
      `SELECT id, reset_token, reset_token_expires 
       FROM users 
       WHERE email = $1 AND reset_token = $2 AND reset_token_expires > $3`,
      [email.toLowerCase(), token, new Date()]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const user = userResult.rows[0];

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password and clear reset token
    await query(
      `UPDATE users 
       SET password = $1, 
           reset_token = NULL, 
           reset_token_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}