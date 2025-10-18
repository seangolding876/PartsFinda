// app/api/quotes/reject/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // Verify that quote exists and belongs to buyer's request
    const quoteCheck = await query(
      `SELECT rq.*, pr.user_id as buyer_id, rq.seller_id, pr.part_name,
              s.name as seller_name, u.name as buyer_name
       FROM request_quotes rq
       INNER JOIN part_requests pr ON rq.request_id = pr.id
       INNER JOIN users u ON pr.user_id = u.id
       INNER JOIN users s ON rq.seller_id = s.id
       WHERE rq.id = $1 AND pr.user_id = $2`,
      [quoteId, userInfo.userId]
    );

    if (quoteCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Quote not found or unauthorized' },
        { status: 404 }
      );
    }

    const quote = quoteCheck.rows[0];

    // Update quote status to 'rejected'
    await query(
      'UPDATE request_quotes SET status = $1 WHERE id = $2',
      ['rejected', quoteId]
    );

    // ✅ Create BUYER notification in single table
    await query(
      `INSERT INTO notifications 
       (user_id, part_request_id, title, message, type, user_type) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userInfo.userId,
        quote.request_id,
        'Quote Rejected',
        `You have rejected the quote for ${quote.part_name} from ${quote.seller_name}`,
        'quote_rejected',
        'buyer'
      ]
    );

    // ✅ Create SELLER notification in single table
    await query(
      `INSERT INTO notifications 
       (user_id, part_request_id, title, message, type, user_type) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        quote.seller_id,
        quote.request_id,
        'Quote Was Rejected',
        `${quote.buyer_name} has rejected your quote for ${quote.part_name}`,
        'quote_rejected',
        'seller'
      ]
    );

    console.log('✅ Quote rejected and notifications created:', quoteId);

    return NextResponse.json({
      success: true,
      message: 'Quote rejected successfully'
    });

  } catch (error: any) {
    console.error('Error rejecting quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reject quote' },
      { status: 500 }
    );
  }
}