// app/api/messages/unread-count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // 1. Get and verify token
    const authHeader = request.headers.get('authData');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const userInfo = verifyToken(token);
    const userId = userInfo.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2. Count unread messages where:
    //    - User is a participant in the conversation
    //    - Message is NOT sent by the user
    //    - Message is unread
    const result = await query(
      `SELECT COUNT(*) as count
       FROM messages m
       INNER JOIN conversation_participants cp 
         ON m.conversation_id = cp.conversation_id
       WHERE cp.user_id = $1
         AND m.sender_id != $1
         AND m.is_read = false`,
      [userId]
    );

    const unreadCount = parseInt(result.rows[0].count) || 0;

    return NextResponse.json({ count: unreadCount });
  } catch (error: any) {
    console.error('❌ Error in /api/messages/unread-count:', error);
    return NextResponse.json({ count: 0 });
  }
}