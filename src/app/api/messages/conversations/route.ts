// app/api/messages/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// app/api/messages/conversations/route.ts - POST method add karen
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const { partRequestId, sellerId } = await request.json();

    // Check if conversation already exists
    const existingConv = await query(
      'SELECT id FROM conversations WHERE part_request_id = $1 AND buyer_id = $2 AND seller_id = $3',
      [partRequestId, userInfo.userId, sellerId]
    );

    if (existingConv.rows.length > 0) {
      return NextResponse.json({
        success: true,
        data: existingConv.rows[0],
        message: 'Conversation already exists'
      });
    }

    // Create new conversation
    const conversation = await query(
      `INSERT INTO conversations (part_request_id, buyer_id, seller_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [partRequestId, userInfo.userId, sellerId]
    );

    return NextResponse.json({
      success: true,
      data: conversation.rows[0]
    });

  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    // Get conversations where user is either buyer or seller
    const conversations = await query(
      `SELECT 
        c.*,
        pr.part_name,
        pr.part_number,
        m.name as make_name,
        md.name as model_name,
        pr.vehicle_year,
        pr.status as request_status,
        
        -- Other participant info
        CASE 
          WHEN c.buyer_id = $1 THEN u_seller.id
          ELSE u_buyer.id
        END as participant_id,
        
        CASE 
          WHEN c.buyer_id = $1 THEN u_seller.name
          ELSE u_buyer.name
        END as participant_name,
        
        CASE 
          WHEN c.buyer_id = $1 THEN u_seller.business_name
          ELSE u_buyer.business_name
        END as participant_business_name,
        
        CASE 
          WHEN c.buyer_id = $1 THEN 'https://media.istockphoto.com/id/1257558676/vector/buyer-avatar-icon.jpg?s=170667a&w=0&k=20&c=VG92-sJeQVUZaZO9cRgBHwnUTVRTDD252tM8z-dYyzA='
          ELSE 'https://img.freepik.com/premium-vector/investment-banker-vector-character-flat-style-illustration_1033579-58081.jpg?semt=ais_hybrid&w=740&q=80'
        END as participant_avatar,
        
        CASE 
          WHEN c.buyer_id = $1 THEN 'seller'
          ELSE 'buyer'
        END as participant_role,
        
        CASE 
          WHEN c.buyer_id = $1 THEN u_seller.parish
          ELSE u_buyer.parish
        END as participant_location,
        
        -- Last message info
        last_msg.message_text as last_message_text,
        last_msg.created_at as last_message_time,
        last_msg.sender_id as last_message_sender_id,
        
        -- Unread count
        (SELECT COUNT(*) FROM messages m2 
         WHERE m2.conversation_id = c.id 
         AND m2.receiver_id = $1 
         AND m2.is_read = false) as unread_count

       FROM conversations c
       
       INNER JOIN part_requests pr ON c.part_request_id = pr.id
       LEFT JOIN makes m ON pr.make_id = m.id
       LEFT JOIN models md ON pr.model_id = md.id
       
       -- Join for buyer
       INNER JOIN users u_buyer ON c.buyer_id = u_buyer.id
       
       -- Join for seller  
       INNER JOIN users u_seller ON c.seller_id = u_seller.id
       
       -- Get last message
       LEFT JOIN LATERAL (
         SELECT message_text, created_at, sender_id
         FROM messages 
         WHERE conversation_id = c.id 
         ORDER BY created_at DESC 
         LIMIT 1
       ) last_msg ON true
       
       WHERE c.buyer_id = $1 OR c.seller_id = $1
       ORDER BY last_msg.created_at DESC NULLS LAST, c.last_message_at DESC`,
      [userInfo.userId]
    );

    const formattedConversations = conversations.rows.map(conv => ({
      id: conv.id,
      participant: {
        id: conv.participant_id,
        name: conv.participant_business_name || conv.participant_name,
        role: conv.participant_role,
        avatar: conv.participant_avatar || '/default-avatar.png',
        location: conv.participant_location,
        online: false // You can implement online status later
      },
      lastMessage: {
        text: conv.last_message_text,
        timestamp: conv.last_message_time,
        sender: conv.last_message_sender_id === userInfo.userId ? 'you' : conv.participant_role
      },
      relatedRequest: {
        id: conv.part_request_id,
        partName: conv.part_name,
        vehicle: `${conv.make_name} ${conv.model_name} (${conv.vehicle_year})`,
        status: conv.request_status
      },
      unreadCount: parseInt(conv.unread_count) || 0
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