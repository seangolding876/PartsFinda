import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

// POST - Submit a new quote
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const sellerId = parseInt(userInfo.userId, 10);

    const body = await request.json();
    const { 
      requestId, 
      price, 
      availability, 
      deliveryTime, 
      notes, 
      warranty, 
      condition 
    } = body;

    // Validate required fields
    if (!requestId || !price) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request ID and price are required' 
      }, { status: 400 });
    }

    // Check if seller already quoted this request
    const existingQuote = await query(
      'SELECT id FROM request_quotes WHERE request_id = $1 AND seller_id = $2',
      [requestId, sellerId]
    );

    if (existingQuote.rows.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'You have already submitted a quote for this request' 
      }, { status: 400 });
    }

    // Insert the quote
    const result = await query(
      `INSERT INTO request_quotes 
       (request_id, seller_id, price, availability, delivery_time, notes, warranty, condition, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING id`,
      [
        requestId, 
        sellerId, 
        price, 
        availability, 
        deliveryTime, 
        notes, 
        warranty, 
        condition
      ]
    );

    return NextResponse.json({
      success: true,
      data: {
        quoteId: result.rows[0].id,
        message: 'Quote submitted successfully'
      }
    });

  } catch (error: any) {
    console.error('Error submitting quote:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to submit quote'
    }, { status: 500 });
  }
}

// GET - Fetch seller's quotes
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const sellerId = parseInt(userInfo.userId, 10);

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    let queryStr = `
      SELECT 
        rq.id,
        rq.price,
        rq.availability,
        rq.delivery_time as "deliveryTime",
        rq.notes,
        rq.warranty,
        rq.condition,
        rq.part_condition as "partCondition",
        rq.status,
        rq.created_at as "createdAt",
        pr.part_name as "partName",
        pr.budget,
        u.name as "buyerName"
      FROM request_quotes rq
      JOIN part_requests pr ON rq.request_id = pr.id
      JOIN users u ON pr.user_id = u.id
      WHERE rq.seller_id = $1
    `;
    
    const queryParams = [sellerId];

    if (requestId) {
      queryStr += ` AND rq.request_id = $2`;
      queryParams.push(Number(requestId));
    }

    queryStr += ` ORDER BY rq.created_at DESC`;

    const quotesResult = await query(queryStr, queryParams);

    return NextResponse.json({
      success: true,
      data: quotesResult.rows
    });

  } catch (error: any) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch quotes'
    }, { status: 500 });
  }
}