// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// app/api/notifications/route.ts - Updated
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    const notifications = await query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userInfo.userId]
    );

    // Also check for new quotes and create notifications
    const newQuotes = await query(
      `SELECT rq.*, pr.part_name, u.name as seller_name
       FROM request_quotes rq
       INNER JOIN part_requests pr ON rq.request_id = pr.id
       INNER JOIN users u ON rq.seller_id = u.id
       WHERE pr.user_id = $1 AND rq.status = 'pending'
       AND rq.created_at > NOW() - INTERVAL '1 hour'`,
      [userInfo.userId]
    );

    // Create notifications for new quotes if not exists
    for (const quote of newQuotes.rows) {
      const existingNotif = await query(
        'SELECT id FROM notifications WHERE related_entity_id = $1 AND type = $2',
        [quote.id, 'new_quote']
      );

      if (existingNotif.rows.length === 0) {
        await query(
          `INSERT INTO notifications 
           (user_id, type, title, message, related_entity_type, related_entity_id) 
           VALUES ($1, 'new_quote', 'New Quote Received', 
           'You have received a new quote for ${quote.part_name} from ${quote.seller_name}', 
           'quote', $2)`,
          [userInfo.userId, quote.id]
        );
      }
    }

    const finalNotifications = await query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userInfo.userId]
    );

    return NextResponse.json({
      success: true,
      data: finalNotifications.rows
    });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}