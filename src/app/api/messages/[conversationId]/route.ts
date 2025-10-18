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

    console.log('🔍 Fetching messages for conversation:', conversationId, 'User:', userInfo.userId);

    // ✅ Verify user has access to this conversation
    const accessCheck = await query(
      `SELECT id, buyer_id, seller_id 
       FROM conversations 
       WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
      [conversationId, userInfo.userId]
    );

    if (accessCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const conversation = accessCheck.rows[0];
    const isBuyer = conversation.buyer_id === userInfo.userId;
    const otherUserId = isBuyer ? conversation.seller_id : conversation.buyer_id;

    // ✅ Get other user's name
    const userInfoResult = await query(
      `SELECT COALESCE(business_name, name) as name FROM users WHERE id = $1`,
      [otherUserId]
    );

    const otherUserName = userInfoResult.rows[0]?.name || 'User';

    // ✅ Get messages
    const messagesResult = await query(
      `SELECT 
        m.id,
        m.message_text,
        m.sender_id,
        m.created_at,
        m.is_read
       FROM messages m
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    // ✅ Format messages with correct sender names
    const formattedMessages = messagesResult.rows.map(msg => {
      const isCurrentUser = msg.sender_id === userInfo.userId;
      
      return {
        id: msg.id.toString(),
        text: msg.message_text,
        sender: isCurrentUser ? 'buyer' : 'seller',
        senderName: isCurrentUser ? 'You' : otherUserName,
        senderId: msg.sender_id,
        timestamp: msg.created_at,
        status: msg.is_read ? 'read' : 'delivered'
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        messages: formattedMessages,
        participant: {
          id: otherUserId,
          name: otherUserName,
          role: isBuyer ? 'seller' : 'buyer'
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching messages:', error);
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

    // ✅ Get conversation and receiver info
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

    // ✅ Update conversation last message
    await query(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    const newMessage = messageResult.rows[0];

    // ✅ Emit socket event for real-time update
    // This will be handled by your socket server

    return NextResponse.json({
      success: true,
      data: {
        id: newMessage.id.toString(),
        text: newMessage.message_text,
        sender: isBuyer ? 'buyer' : 'seller',
        senderName: 'You',
        senderId: userInfo.userId,
        timestamp: newMessage.created_at,
        status: 'sent'
      }
    });

  } catch (error: any) {
    console.error('❌ Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}