import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const userInfo = verifyToken(token);
      
      // Verify user still exists in database
      const userResult = await query(
        'SELECT id, email, role FROM users WHERE id = $1',
        [userInfo.userId]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({ valid: false }, { status: 401 });
      }

      return NextResponse.json({ 
        valid: true,
        user: userResult.rows[0]
      });
      
    } catch (error) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}