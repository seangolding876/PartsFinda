import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    
    const { quoteId } = await request.json();
    
    if (!quoteId) {
      return NextResponse.json(
        { success: false, error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    // Transaction start karenge
    await query('BEGIN');

    // 1. Verify that quote exists and belongs to buyer's request
    const quoteCheck = await query(
      `SELECT rq.*, pr.user_id as buyer_id 
       FROM request_quotes rq
       INNER JOIN part_requests pr ON rq.request_id = pr.id
       WHERE rq.id = $1 AND pr.user_id = $2`,
      [quoteId, userInfo.userId]
    );

    if (quoteCheck.rows.length === 0) {
      await query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Quote not found or unauthorized' },
        { status: 404 }
      );
    }

    const quote = quoteCheck.rows[0];

    // 2. Update quote status to 'accepted'
    await query(
      'UPDATE request_quotes SET status = $1 WHERE id = $2',
      ['accepted', quoteId]
    );

    // 3. Update part request status to 'fulfilled'
    await query(
      'UPDATE part_requests SET status = $1 WHERE id = $2',
      ['fulfilled', quote.request_id]
    );

    // 4. Reject all other quotes for this request
    await query(
      'UPDATE request_quotes SET status = $1 WHERE request_id = $2 AND id != $3',
      ['rejected', quote.request_id, quoteId]
    );

      // After accepting quote, create notifications
    await query(
      `INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id) 
       VALUES ($1, 'quote_accepted', 'Quote Accepted', 'Your quote has been accepted by the buyer', 'quote', $2)`,
      [quote.seller_id, quoteId]
    );

    // Send email notification
    await fetch(`${process.env.NEXTAUTH_URL}/api/email/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'quote_accepted',
        userId: quote.seller_id,
        data: {
          partName: quote.part_name,
          price: quote.price,
          buyerName: userInfo.name
        }
      })
    });

    await query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Quote accepted successfully'
    });

  } catch (error: any) {
    await query('ROLLBACK');
    console.error('Error accepting quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to accept quote' },
      { status: 500 }
    );
  }
}