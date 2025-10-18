// app/api/messages/[conversationId]/route.ts - OPTIMIZED
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const conversationId = params.conversationId;

    // Verify access
    const accessCheck = await query(
      `SELECT c.id, 
              CASE 
                WHEN c.buyer_id = $1 THEN u_seller.name
                ELSE u_buyer.name 
              END as participant_name
       FROM conversations c
       INNER JOIN users u_buyer ON c.buyer_id = u_buyer.id
       INNER JOIN users u_seller ON c.seller_id = u_seller.id
       WHERE c.id = $2 AND (c.buyer_id = $1 OR c.seller_id = $1)`,
      [userInfo.userId, conversationId]
    );

    if (accessCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const participantName = accessCheck.rows[0].participant_name;

    // Get messages with proper sender identification
    const messages = await query(
      `SELECT 
        m.id,
        m.message_text,
        m.sender_id,
        m.created_at,
        m.is_read,
        u.name as sender_name,
        CASE 
          WHEN m.sender_id = $1 THEN 'buyer'
          ELSE 'seller'
        END as sender_role
       FROM messages m
       INNER JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $2
       ORDER BY m.created_at ASC`,
      [userInfo.userId, conversationId]
    );

    // Mark messages as read
    await query(
      'UPDATE messages SET is_read = true, read_at = NOW() WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false',
      [conversationId, userInfo.userId]
    );

    // Format messages with proper sender info
    const formattedMessages = messages.rows.map(msg => ({
      id: msg.id.toString(),
      text: msg.message_text,
      sender: msg.sender_role as 'buyer' | 'seller',
      senderName: msg.sender_name,
      timestamp: msg.created_at,
      status: msg.is_read ? 'read' : 'delivered'
    }));

    return NextResponse.json({
      success: true,
      data: {
        messages: formattedMessages,
        participantName: participantName
      }
    });

  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const conversationId = params.conversationId;
    const { messageText } = await request.json();

    if (!messageText?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message text is required' },
        { status: 400 }
      );
    }

    // Get conversation info
    const convInfo = await query(
      `SELECT 
        buyer_id,
        seller_id,
        CASE 
          WHEN buyer_id = $1 THEN seller_id
          ELSE buyer_id
        END as receiver_id
       FROM conversations 
       WHERE id = $2 AND (buyer_id = $1 OR seller_id = $1)`,
      [userInfo.userId, conversationId]
    );

    if (convInfo.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const receiverId = convInfo.rows[0].receiver_id;

    // Insert message (API fallback)
    const messageResult = await query(
      `INSERT INTO messages 
       (conversation_id, sender_id, receiver_id, message_text) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, message_text, sender_id, created_at`,
      [conversationId, userInfo.userId, receiverId, messageText.trim()]
    );

    // Update conversation
    await query(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    // Create notification
    await query(
      `INSERT INTO notifications 
       (user_id, type, title, message, user_type) 
       VALUES ($1, 'new_message', 'New Message', 'You have a new message', 'buyer')`,
      [receiverId]
    );

    return NextResponse.json({
      success: true,
      data: {
        id: messageResult.rows[0].id.toString(),
        text: messageResult.rows[0].message_text,
        sender: 'buyer',
        timestamp: messageResult.rows[0].created_at,
        status: 'sent'
      }
    });

  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}