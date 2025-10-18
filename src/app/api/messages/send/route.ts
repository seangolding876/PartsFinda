// app/api/messages/send/route.ts - SIMPLIFIED
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const { receiverId, partRequestId, messageText } = await request.json();

    // Find or create conversation
    let conversation = await query(
      `SELECT id FROM conversations 
       WHERE part_request_id = $1 AND buyer_id = $2 AND seller_id = $3`,
      [partRequestId, userInfo.userId, receiverId]
    );

    let conversationId;
    if (conversation.rows.length === 0) {
      const newConversation = await query(
        `INSERT INTO conversations (part_request_id, buyer_id, seller_id) 
         VALUES ($1, $2, $3) RETURNING id`,
        [partRequestId, userInfo.userId, receiverId]
      );
      conversationId = newConversation.rows[0].id;
    } else {
      conversationId = conversation.rows[0].id;
    }

    // Insert message
    const messageResult = await query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [conversationId, userInfo.userId, receiverId, messageText]
    );

    return NextResponse.json({
      success: true,
      conversationId: conversationId,
      messageId: messageResult.rows[0].id
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}