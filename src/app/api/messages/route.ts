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

    // Get user's conversations with last message
    const conversations = await query(
      `SELECT 
        c.*,
        pr.part_name,
        m.name as make_name,
        md.name as model_name,
        pr.vehicle_year,
        
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
          WHEN c.buyer_id = $1 THEN 'seller'
          ELSE 'buyer'
        END as participant_role,
        
        -- Last message
        last_msg.message_text as last_message,
        last_msg.created_at as last_message_time,
        last_msg.sender_id as last_message_sender_id,
        
        -- Unread count
        (SELECT COUNT(*) FROM messages m 
         WHERE m.conversation_id = c.id 
         AND m.receiver_id = $1 
         AND m.is_read = false) as unread_count
        
       FROM conversations c
       INNER JOIN part_requests pr ON c.part_request_id = pr.id
       LEFT JOIN makes m ON pr.make_id = m.id
       LEFT JOIN models md ON pr.model_id = md.id
       INNER JOIN users u_buyer ON c.buyer_id = u_buyer.id
       INNER JOIN users u_seller ON c.seller_id = u_seller.id
       LEFT JOIN LATERAL (
         SELECT message_text, created_at, sender_id
         FROM messages 
         WHERE conversation_id = c.id 
         ORDER BY created_at DESC 
         LIMIT 1
       ) last_msg ON true
       
       WHERE c.buyer_id = $1 OR c.seller_id = $1
       ORDER BY last_msg.created_at DESC NULLS LAST`,
      [userInfo.userId]
    );

    return NextResponse.json({
      success: true,
      data: conversations.rows
    });

  } catch (error) {
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
    const { partRequestId, sellerId, messageText } = await request.json();

    // Find or create conversation
    let conversation = await query(
      `SELECT id FROM conversations 
       WHERE part_request_id = $1 AND buyer_id = $2 AND seller_id = $3`,
      [partRequestId, userInfo.userId, sellerId]
    );

    let conversationId;
    if (conversation.rows.length === 0) {
      const newConversation = await query(
        `INSERT INTO conversations (part_request_id, buyer_id, seller_id) 
         VALUES ($1, $2, $3) RETURNING id`,
        [partRequestId, userInfo.userId, sellerId]
      );
      conversationId = newConversation.rows[0].id;
    } else {
      conversationId = conversation.rows[0].id;
    }

    // Determine receiver
    const receiverCheck = await query(
      'SELECT buyer_id, seller_id FROM conversations WHERE id = $1',
      [conversationId]
    );
    
    const conv = receiverCheck.rows[0];
    const receiverId = conv.buyer_id === userInfo.userId ? conv.seller_id : conv.buyer_id;

    // Insert message
    const messageResult = await query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [conversationId, userInfo.userId, receiverId, messageText]
    );

    // Update conversation last message
    await query(
      'UPDATE conversations SET last_message_at = NOW() WHERE id = $1',
      [conversationId]
    );

    return NextResponse.json({
      success: true,
      data: {
        message: messageResult.rows[0],
        conversationId
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}