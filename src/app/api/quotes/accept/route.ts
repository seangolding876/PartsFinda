// app/api/quotes/accept/route.ts (updated)
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

    // Transaction start
    await query('BEGIN');

    // 1. Verify that quote exists and belongs to buyer's request
    const quoteCheck = await query(
      `SELECT rq.*, pr.user_id as buyer_id, pr.part_name, 
              u.name as buyer_name, rq.seller_id, s.name as seller_name,
              s.email as seller_email, m.name as make_name, md.name as model_name,
              pr.vehicle_year
       FROM request_quotes rq
       INNER JOIN part_requests pr ON rq.request_id = pr.id
       INNER JOIN users u ON pr.user_id = u.id
       INNER JOIN users s ON rq.seller_id = s.id
       LEFT JOIN makes m ON pr.make_id = m.id
       LEFT JOIN models md ON pr.model_id = md.id
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

    await query('COMMIT');

    console.log('✅ Quote accepted successfully:', quoteId);

    // 5. Send email notification to seller
    try {
      const emailResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/email/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'quote_accepted',
          userId: quote.seller_id,
          data: {
            partName: quote.part_name,
            price: quote.price,
            buyerName: quote.buyer_name,
            vehicle: `${quote.make_name} ${quote.model_name} (${quote.vehicle_year})`,
            requestId: quote.request_id
          }
        })
      });

      const emailResult = await emailResponse.json();
      console.log('📧 Quote acceptance email sent:', emailResult);
    } catch (emailError) {
      console.error('❌ Failed to send email notification:', emailError);
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Quote accepted successfully',
      sellerId: quote.seller_id
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