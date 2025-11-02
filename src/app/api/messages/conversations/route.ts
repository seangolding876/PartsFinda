// app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 /api/conversations called');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ No auth header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    console.log('👤 User fetching conversations:', userInfo.userId);

    // CORRECTED QUERY: Using conversation_participants table
    const queryStr = `
      SELECT DISTINCT  ON (c.id)
        c.id,
        c.part_request_id,
        c.created_at,
        c.last_message_at,
        pr.part_name,
        pr.part_number,
        m.name as make_name,
        md.name as model_name,
        pr.vehicle_year,
        pr.status as request_status,
        
        -- Get participant info (the other user in conversation)
        other_user.id as participant_id,
        COALESCE(other_user.business_name, other_user.name) as participant_name,
        other_user.role as participant_role,
        other_user.email as participant_email,
        
        -- Last message
        last_msg.message_text as last_message_text,
        last_msg.created_at as last_message_time,
        last_msg.sender_id as last_message_sender_id,
        
        -- Unread count
        (SELECT COUNT(*) FROM messages m2 
         WHERE m2.conversation_id = c.id 
         AND m2.receiver_id = $1 
         AND m2.is_read = false) as unread_count

      FROM conversation_participants cp
      INNER JOIN conversations c ON cp.conversation_id = c.id
      
      -- Join with other participant
      INNER JOIN conversation_participants other_cp ON c.id = other_cp.conversation_id AND other_cp.user_id != $1
      INNER JOIN users other_user ON other_cp.user_id = other_user.id
      
      -- Part request info (if exists)
      LEFT JOIN part_requests pr ON c.part_request_id = pr.id
      LEFT JOIN makes m ON pr.make_id = m.id
      LEFT JOIN models md ON pr.model_id = md.id
      
      -- Last message
      LEFT JOIN LATERAL (
        SELECT message_text, created_at, sender_id
        FROM messages 
        WHERE conversation_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) last_msg ON true
      
      WHERE cp.user_id = $1
      ORDER BY c.id, COALESCE(last_msg.created_at, c.created_at) DESC;
    `;

    const result = await query(queryStr, [userInfo.userId]);
    console.log('✅ Conversations query result:', result.rows.length);

    const formattedConversations = result.rows.map(conv => ({
      id: conv.id.toString(),
      participant: {
        id: conv.participant_id,
        name: conv.participant_name,
        role: conv.participant_role,
        email: conv.participant_email,
        avatar: conv.participant_role === 'seller' 
          ? 'https://media.istockphoto.com/id/1257558676/vector/buyer-avatar-icon.jpg?s=170667a&w=0&k=20&c=VG92-sJeQVUZaZO9cRgBHwnUTVRTDD252tM8z-dYyzA='
          : 'https://img.freepik.com/premium-vector/investment-banker-vector-character-flat-style-illustration_1033579-58081.jpg',
        location: 'Unknown',
        online: false
      },
      lastMessage: {
        text: conv.last_message_text || 'No messages yet',
        timestamp: conv.last_message_time || conv.created_at,
        sender: conv.last_message_sender_id === userInfo.userId ? 'buyer' : 'seller'
      },
      relatedRequest: conv.part_request_id ? {
        id: conv.part_request_id,
        partName: conv.part_name,
        vehicle: `${conv.make_name || ''} ${conv.model_name || ''} ${conv.vehicle_year || ''}`.trim(),
        status: conv.request_status
      } : null,
      unreadCount: parseInt(conv.unread_count) || 0,
      isAdminConversation: false
    }));

    return NextResponse.json({
      success: true,
      data: formattedConversations
    });

  } catch (error: any) {
    console.error('❌ Error in /api/conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const { sellerId, partRequestId, messageText } = await request.json();

    console.log('🔄 Creating conversation:', { userId: userInfo.userId, sellerId, partRequestId });

    // Check if conversation already exists
    const existingConv = await query(
      `SELECT c.id 
       FROM conversations c
       INNER JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = $1
       INNER JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = $2
       WHERE c.part_request_id = $3 OR ($3 IS NULL AND c.part_request_id IS NULL)`,
      [userInfo.userId, sellerId, partRequestId]
    );

    let conversationId;
    let isNewConversation = false;

    if (existingConv.rows.length > 0) {
      conversationId = existingConv.rows[0].id;
      console.log('✅ Existing conversation found:', conversationId);
    } else {
      // Create new conversation
      const conversation = await query(
        `INSERT INTO conversations (part_request_id, created_at) 
         VALUES ($1, NOW()) 
         RETURNING id`,
        [partRequestId]
      );
      conversationId = conversation.rows[0].id;

      // Add participants
      await query(
        `INSERT INTO conversation_participants (conversation_id, user_id, joined_at) 
         VALUES ($1, $2, NOW()), ($1, $3, NOW())`,
        [conversationId, userInfo.userId, sellerId]
      );

      isNewConversation = true;
      console.log('✅ New conversation created:', conversationId);
    }

    // Insert the first message if provided
    if (messageText && messageText.trim() && isNewConversation) {
      await query(
        `INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text, created_at) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [conversationId, userInfo.userId, sellerId, messageText.trim()]
      );
      console.log('✅ Initial message added');
    }

    return NextResponse.json({
      success: true,
      data: {
        id: conversationId,
        is_new: isNewConversation
      }
    });

  } catch (error: any) {
    console.error('❌ Error creating conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}