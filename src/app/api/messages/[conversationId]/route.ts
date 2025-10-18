// app/api/messages/[conversationId]/route.ts - CORRECT VERSION
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

    console.log('🔍 Fetching messages for conversation:', conversationId, 'User:', userInfo.userId);

    // ✅ Verify user has access to this conversation
    const accessCheck = await query(
      `SELECT id, buyer_id, seller_id 
       FROM conversations 
       WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
      [conversationId, userInfo.userId]
    );

    if (accessCheck.rows.length === 0) {
      console.log('❌ Access denied for conversation:', conversationId);
      return NextResponse.json(
        { success: false, error: 'Conversation not found or unauthorized' },
        { status: 404 }
      );
    }

    const conversation = accessCheck.rows[0];
    const isBuyer = conversation.buyer_id === userInfo.userId;

    // ✅ Get participant info
    const participantInfo = await query(
      `SELECT 
        u.id,
        COALESCE(u.business_name, u.name) as name
       FROM users u
       WHERE u.id = $1`,
      [isBuyer ? conversation.seller_id : conversation.buyer_id]
    );

    const participantName = participantInfo.rows[0]?.name || 'User';

    // ✅ Get messages for this specific conversation
    const messages = await query(
      `SELECT 
        m.id,
        m.message_text,
        m.sender_id,
        m.created_at,
        m.is_read,
        u.name as sender_name
       FROM messages m
       INNER JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    console.log('📨 Found messages:', messages.rows.length);

    // ✅ Format messages properly
    const formattedMessages = messages.rows.map(msg => {
      const isCurrentUser = msg.sender_id === userInfo.userId;
      
      return {
        id: msg.id.toString(),
        text: msg.message_text,
        sender: isCurrentUser ? 'buyer' : 'seller',
        senderName: isCurrentUser ? 'You' : participantName,
        timestamp: msg.created_at,
        status: msg.is_read ? 'read' : 'delivered'
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        messages: formattedMessages,
        participant: {
          id: isBuyer ? conversation.seller_id : conversation.buyer_id,
          name: participantName,
          role: isBuyer ? 'seller' : 'buyer'
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages: ' + error.message },
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

    console.log('📤 Sending message to conversation:', conversationId);

    // ✅ Get conversation info
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
    const isBuyer = convInfo.rows[0].buyer_id === userInfo.userId;

    // ✅ Insert message
    const messageResult = await query(
      `INSERT INTO messages 
       (conversation_id, sender_id, receiver_id, message_text) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, message_text, created_at`,
      [conversationId, userInfo.userId, receiverId, messageText.trim()]
    );

    // ✅ Update conversation last message time
    await query(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    const newMessage = messageResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        id: newMessage.id.toString(),
        text: newMessage.message_text,
        sender: isBuyer ? 'buyer' : 'seller',
        senderName: 'You',
        timestamp: newMessage.created_at,
        status: 'sent'
      }
    });

  } catch (error: any) {
    console.error('❌ Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message: ' + error.message },
      { status: 500 }
    );
  }
}