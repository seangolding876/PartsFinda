// app/api/messages/[conversationId]/route.ts - CORRECTED VERSION
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

    console.log('🔄 Fetching messages for conversation:', conversationId, 'user:', userInfo.userId);

    // Verify user has access to this conversation via conversation_participants
    const accessCheck = await query(
      `SELECT cp.conversation_id 
       FROM conversation_participants cp
       WHERE cp.conversation_id = $1 AND cp.user_id = $2`,
      [conversationId, userInfo.userId]
    );

    if (accessCheck.rows.length === 0) {
      console.log('❌ Access denied - user not in conversation participants');
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get other participant info
    const participantInfo = await query(
      `SELECT u.id, u.name, u.business_name, u.email, u.role
       FROM conversation_participants cp
       INNER JOIN users u ON cp.user_id = u.id
       WHERE cp.conversation_id = $1 AND cp.user_id != $2
       LIMIT 1`,
      [conversationId, userInfo.userId]
    );

    if (participantInfo.rows.length === 0) {
      console.log('❌ No other participant found');
      return NextResponse.json(
        { success: false, error: 'No participant found' },
        { status: 404 }
      );
    }

    const participant = participantInfo.rows[0];
    const participantName = participant.business_name || participant.name;

    // Get messages
    const messagesResult = await query(
      `SELECT 
        m.id,
        m.message_text,
        m.sender_id,
        m.receiver_id,
        m.created_at,
        m.is_read,
        u.name as sender_name,
        u.business_name as sender_business_name
       FROM messages m
       INNER JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    console.log('✅ Messages found:', messagesResult.rows.length);

    // Mark messages as read
    await query(
      `UPDATE messages SET is_read = true 
       WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false`,
      [conversationId, userInfo.userId]
    );

    // Format messages
    const formattedMessages = messagesResult.rows.map(msg => {
      const isCurrentUser = msg.sender_id === userInfo.userId;
      const senderName = isCurrentUser ? 'You' : (msg.sender_business_name || msg.sender_name);
      
      return {
        id: msg.id.toString(),
        text: msg.message_text,
        sender: isCurrentUser ? 'buyer' : 'seller',
        senderName: senderName,
        senderId: msg.sender_id,
        timestamp: msg.created_at,
        status: msg.is_read ? 'read' : 'delivered'
      };
    });

    // Get conversation details
    const convDetails = await query(
      `SELECT c.part_request_id, pr.part_name, pr.vehicle_year,
              mk.name as make_name, md.name as model_name
       FROM conversations c
       LEFT JOIN part_requests pr ON c.part_request_id = pr.id
       LEFT JOIN makes mk ON pr.make_id = mk.id
       LEFT JOIN models md ON pr.model_id = md.id
       WHERE c.id = $1`,
      [conversationId]
    );

    const conv = convDetails.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        messages: formattedMessages,
        participant: {
          id: participant.id,
          name: participantName,
          email: participant.email,
          role: participant.role,
          avatar: participant.role === 'seller' 
            ? 'https://media.istockphoto.com/id/1257558676/vector/buyer-avatar-icon.jpg?s=170667a&w=0&k=20&c=VG92-sJeQVUZaZO9cRgBHwnUTVRTDD252tM8z-dYyzA='
            : 'https://img.freepik.com/premium-vector/investment-banker-vector-character-flat-style-illustration_1033579-58081.jpg'
        },
        conversation: {
          id: conversationId,
          partRequestId: conv?.part_request_id,
          relatedRequest: conv?.part_request_id ? {
            partName: conv.part_name,
            vehicle: `${conv.make_name || ''} ${conv.model_name || ''} ${conv.vehicle_year || ''}`.trim()
          } : null
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

    console.log('📤 Sending message to conversation:', conversationId);

    if (!messageText?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message text is required' },
        { status: 400 }
      );
    }

    // Get receiver ID (the other participant)
    const receiverInfo = await query(
      `SELECT user_id 
       FROM conversation_participants 
       WHERE conversation_id = $1 AND user_id != $2
       LIMIT 1`,
      [conversationId, userInfo.userId]
    );

    if (receiverInfo.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No receiver found' },
        { status: 404 }
      );
    }

    const receiverId = receiverInfo.rows[0].user_id;

    // Insert message
    const messageResult = await query(
      `INSERT INTO messages 
       (conversation_id, sender_id, receiver_id, message_text, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, message_text, created_at, sender_id`,
      [conversationId, userInfo.userId, receiverId, messageText.trim()]
    );

    // Update conversation last message time
    await query(
      'UPDATE conversations SET last_message_at = NOW() WHERE id = $1',
      [conversationId]
    );

    const newMessage = messageResult.rows[0];

    console.log('✅ Message sent successfully:', newMessage.id);

    return NextResponse.json({
      success: true,
      data: {
        id: newMessage.id.toString(),
        text: newMessage.message_text,
        sender: 'buyer',
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