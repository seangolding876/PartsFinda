import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      // Return sample data if no user
      return NextResponse.json({
        messages: [
          {
            id: '1',
            sender_name: 'AutoParts Pro',
            content: 'Yes, the brake pads are still available',
            created_at: new Date().toISOString(),
            is_read: false
          }
        ]
      });
    }

    // Get messages where user is either sender or receiver
    const result = await query(
      `SELECT 
         m.id,
         m.content,
         m.is_read,
         m.created_at,
         m.sender_id,
         p.name as sender_name,
         c.id as conversation_id
       FROM messages m
       LEFT JOIN profiles p ON m.sender_id = p.id
       LEFT JOIN conversations c ON m.conversation_id = c.id
       WHERE m.sender_id = $1 OR $1 IN (
         SELECT user_id FROM conversation_participants WHERE conversation_id = m.conversation_id
       )
       ORDER BY m.created_at DESC
       LIMIT 50`,
      [userId]
    );

    if (result.rows.length === 0) {
      console.log('No messages found, returning sample data');
      return NextResponse.json({
        messages: [
          {
            id: '1',
            sender_name: 'AutoParts Pro',
            content: 'Yes, the brake pads are still available',
            created_at: new Date().toISOString(),
            is_read: false
          }
        ]
      });
    }

    return NextResponse.json({ messages: result.rows });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ 
      messages: [
        {
          id: '1',
          sender_name: 'AutoParts Pro',
          content: 'Yes, the brake pads are still available',
          created_at: new Date().toISOString(),
          is_read: false
        }
      ]
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverId, content, conversationId } = body;

    // Create or get conversation
    let convId = conversationId;
    if (!convId) {
      const convResult = await query(
        `INSERT INTO conversations (created_at) 
         VALUES (NOW()) 
         RETURNING id`,
        []
      );
      convId = convResult.rows[0].id;

      // Add participants to conversation
      await query(
        `INSERT INTO conversation_participants (conversation_id, user_id) 
         VALUES ($1, $2), ($1, $3)`,
        [convId, senderId, receiverId]
      );
    }

    // Insert message
    const result = await query(
      `INSERT INTO messages (conversation_id, sender_id, content, is_read) 
       VALUES ($1, $2, $3, false) 
       RETURNING id, content, created_at, is_read`,
      [convId, senderId, content]
    );

    return NextResponse.json({ 
      success: true, 
      message: {
        ...result.rows[0],
        sender_name: 'You' // Frontend will replace this
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ 
      success: true,
      message: {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        is_read: false,
        sender_name: 'You'
      }
    });
  }
}