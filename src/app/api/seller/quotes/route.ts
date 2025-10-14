import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

interface QuoteData {
  requestId: number;
  price: number;
  availability: 'in_stock' | 'out_of_stock' | 'pre_order';
  deliveryTime: string;
  notes?: string;
  warranty?: string;
  condition?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const sellerId = parseInt(userInfo.userId, 10);

    // Verify user is a seller
    const sellerCheck = await query(
      'SELECT id, name, email, role FROM users WHERE id = $1 AND role = $2',
      [sellerId, 'seller']
    );

    if (sellerCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Seller not found or unauthorized' }, { status: 403 });
    }

    const seller = sellerCheck.rows[0];
    const body: QuoteData = await request.json();

    // Validation
    const requiredFields = ['requestId', 'price', 'availability', 'deliveryTime'];
    for (const field of requiredFields) {
      if (!body[field as keyof QuoteData]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Check if request exists and is still open
    const requestCheck = await query(
      'SELECT id, status, user_id FROM part_requests WHERE id = $1',
      [body.requestId]
    );

    if (requestCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Part request not found' }, { status: 404 });
    }

    if (requestCheck.rows[0].status !== 'open') {
      return NextResponse.json({ success: false, error: 'This request is no longer accepting quotes' }, { status: 400 });
    }

    // Check if seller has already quoted this request
    const existingQuote = await query(
      'SELECT id FROM request_quotes WHERE request_id = $1 AND seller_id = $2',
      [body.requestId, sellerId]
    );

    if (existingQuote.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'You have already submitted a quote for this request' }, { status: 400 });
    }

    // Start transaction
    await query('BEGIN');

    try {
      // Insert quote
      const quoteResult = await query(
        `INSERT INTO request_quotes (
          request_id, seller_id, seller_name, price, availability, 
          delivery_time, notes, warranty, condition, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, created_at`,
        [
          body.requestId,
          sellerId,
          seller.name,
          body.price,
          body.availability,
          body.deliveryTime,
          body.notes || null,
          body.warranty || null,
          body.condition || null,
          'submitted'
        ]
      );

      // Create notification for buyer
      await query(
        `INSERT INTO buyer_notifications (
          user_id, part_request_id, title, message, type, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          requestCheck.rows[0].user_id,
          body.requestId,
          'New Quote Received',
          `You have received a new quote for your part request from ${seller.name}`,
          'quote_received',
          JSON.stringify({
            quote_id: quoteResult.rows[0].id,
            seller_name: seller.name,
            price: body.price,
            part_request_id: body.requestId
          })
        ]
      );

      // Commit transaction
      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Quote submitted successfully',
        data: {
          quoteId: quoteResult.rows[0].id,
          submittedAt: quoteResult.rows[0].created_at
        }
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('Error submitting quote:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to submit quote',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}