// app/api/conversations/route.ts (Final Updated Version)
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    // Check if user is admin
    const userCheck = await query(
      'SELECT role FROM users WHERE id = $1',
      [userInfo.userId]
    );

    const isAdmin = userCheck.rows[0]?.role === 'admin';

    let queryStr = `
      SELECT 
        c.*,
        pr.part_name,
        pr.part_number,
        m.name as make_name,
        md.name as model_name,
        pr.vehicle_year,
        pr.status as request_status,
        
        -- Participant info based on current user
        CASE 
          WHEN c.buyer_id = $1 THEN u_seller.id
          ELSE u_buyer.id
        END as participant_id,
        
        CASE 
          WHEN c.buyer_id = $1 THEN 
            COALESCE(u_seller.business_name, u_seller.name)
          ELSE 
            COALESCE(u_buyer.business_name, u_buyer.name)
        END as participant_name,
        
        CASE 
          WHEN c.buyer_id = $1 THEN 'seller'
          ELSE 'buyer'
        END as participant_role,
        
        -- Last message with proper fallback
        COALESCE(last_msg.message_text, 'No messages yet') as last_message_text,
        COALESCE(last_msg.created_at, c.created_at) as last_message_time,
        
        -- Unread count
        (SELECT COUNT(*) FROM messages m2 
         WHERE m2.conversation_id = c.id 
         AND m2.receiver_id = $1 
         AND m2.is_read = false) as unread_count

       FROM conversations c
       
       LEFT JOIN part_requests pr ON c.part_request_id = pr.id
       LEFT JOIN makes m ON pr.make_id = m.id
       LEFT JOIN models md ON pr.model_id = md.id
       INNER JOIN users u_buyer ON c.buyer_id = u_buyer.id
       INNER JOIN users u_seller ON c.seller_id = u_seller.id
       
       -- Efficient last message fetch
       LEFT JOIN LATERAL (
         SELECT message_text, created_at
         FROM messages 
         WHERE conversation_id = c.id 
         ORDER BY created_at DESC 
         LIMIT 1
       ) last_msg ON true
       
       WHERE (c.buyer_id = $1 OR c.seller_id = $1)
    `;

    const queryParams = [userInfo.userId];

    // For admin, show all conversations including those without part requests
    if (!isAdmin) {
      queryStr += ` AND c.part_request_id IS NOT NULL`;
    }

    queryStr += ` ORDER BY COALESCE(last_msg.created_at, c.created_at) DESC`;

    const conversations = await query(queryStr, queryParams);

    const formattedConversations = conversations.rows.map(conv => ({
      id: conv.id,
      participant: {
        id: conv.participant_id,
        name: conv.participant_name,
        role: conv.participant_role,
        avatar: conv.participant_role === 'seller' 
          ? 'https://media.istockphoto.com/id/1257558676/vector/buyer-avatar-icon.jpg?s=170667a&w=0&k=20&c=VG92-sJeQVUZaZO9cRgBHwnUTVRTDD252tM8z-dYyzA='
          : 'https://img.freepik.com/premium-vector/investment-banker-vector-character-flat-style-illustration_1033579-58081.jpg',
        online: false
      },
      lastMessage: {
        text: conv.last_message_text,
        timestamp: conv.last_message_time,
        sender: 'other'
      },
      relatedRequest: conv.part_request_id ? {
        id: conv.part_request_id,
        partName: conv.part_name,
        vehicle: `${conv.make_name || ''} ${conv.model_name || ''} ${conv.vehicle_year || ''}`.trim(),
        status: conv.request_status
      } : null,
      unreadCount: parseInt(conv.unread_count) || 0,
      isAdminConversation: !conv.part_request_id
    }));

    return NextResponse.json({
      success: true,
      data: formattedConversations
    });

  } catch (error: any) {
    console.error('Error fetching conversations:', error);
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

    // Check if user is admin
    const userCheck = await query(
      'SELECT role, name FROM users WHERE id = $1',
      [userInfo.userId]
    );

    const isAdmin = userCheck.rows[0]?.role === 'admin';

    // For admin conversations, partRequestId can be null
    if (!isAdmin && !partRequestId) {
      return NextResponse.json(
        { success: false, error: 'Part request ID is required for buyer conversations' },
        { status: 400 }
      );
    }

    // Check existing conversation
    let existingConv;
    if (partRequestId) {
      existingConv = await query(
        `SELECT id, buyer_id, seller_id 
         FROM conversations 
         WHERE part_request_id = $1 AND buyer_id = $2 AND seller_id = $3`,
        [partRequestId, userInfo.userId, sellerId]
      );
    } else {
      // For admin conversations without part request
      existingConv = await query(
        `SELECT id, buyer_id, seller_id 
         FROM conversations 
         WHERE part_request_id IS NULL AND buyer_id = $1 AND seller_id = $2`,
        [userInfo.userId, sellerId]
      );
    }

    let conversationId;
    let isNewConversation = false;

    if (existingConv.rows.length > 0) {
      conversationId = existingConv.rows[0].id;
    } else {
      // Create new conversation
      const conversation = await query(
        `INSERT INTO conversations (part_request_id, buyer_id, seller_id, is_admin_conversation) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, buyer_id, seller_id, part_request_id, created_at`,
        [partRequestId, userInfo.userId, sellerId, isAdmin && !partRequestId]
      );
      conversationId = conversation.rows[0].id;
      isNewConversation = true;
    }

    // Insert the first message if provided
    if (messageText && isNewConversation) {
      await query(
        `INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text) 
         VALUES ($1, $2, $3, $4)`,
        [conversationId, userInfo.userId, sellerId, messageText]
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: conversationId,
        buyer_id: userInfo.userId,
        seller_id: sellerId,
        part_request_id: partRequestId,
        is_new: isNewConversation
      },
      conversationId: conversationId,
      message: isNewConversation ? 'Conversation created' : 'Conversation already exists'
    });

  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}