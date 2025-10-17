// app/api/messages/[conversationId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';


export const dynamic = 'force-dynamic';


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
      'SELECT id FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [conversationId, userInfo.userId]
    );

    if (accessCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages with proper sender names
    const messages = await query(
      `SELECT 
        m.*,
        u.name as sender_name,
        u.business_name as sender_business_name,
        CASE 
          WHEN u.id = c.buyer_id THEN 'buyer'
          ELSE 'seller'
        END as sender_role
       FROM messages m
       INNER JOIN users u ON m.sender_id = u.id
       INNER JOIN conversations c ON m.conversation_id = c.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    // Mark messages as read
    await query(
      'UPDATE messages SET is_read = true WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false',
      [conversationId, userInfo.userId]
    );

    return NextResponse.json({
      success: true,
      data: messages.rows
    });

  } catch (error) {
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

    // Verify access and get receiver info
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

    // Insert message
    const messageResult = await query(
      `INSERT INTO messages 
       (conversation_id, sender_id, receiver_id, message_text) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [conversationId, userInfo.userId, receiverId, messageText]
    );

    // Update conversation last message time
    await query(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    // Create notification for receiver
    await query(
      `INSERT INTO notifications 
       (user_id, type, title, message, related_entity_type, related_entity_id) 
       VALUES ($1, 'new_message', 'New Message', 'You have a new message', 'conversation', $2)`,
      [receiverId, conversationId]
    );

    // Send email notification
// In your message sending logic
try {
  const receiverInfo = await query(
    'SELECT name, email FROM users WHERE id = $1',
    [receiverId]
  );

  if (receiverInfo.rows.length > 0) {
    const senderInfo = await query(
      'SELECT name, business_name FROM users WHERE id = $1',
      [userInfo.userId]
    );

    await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: receiverInfo.rows[0].email,
        subject: 'New Message on PartsFinda',
        template: 'new-message',
        data: {
          senderName: senderInfo.rows[0]?.business_name || senderInfo.rows[0]?.name,
          messagePreview: messageText.length > 50 ? 
            messageText.substring(0, 50) + '...' : messageText,
          conversationLink: `${process.env.NEXTAUTH_URL}/messages`
        }
      })
    });
  }
} catch (emailError) {
  console.error('Email sending failed:', emailError);
}

    return NextResponse.json({
      success: true,
      data: messageResult.rows[0]
    });

  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}