import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import smsQueueService from '@/lib/sms-queue-service';

export const dynamic = 'force-dynamic';

// POST - Submit a new quote
export async function POST(request: NextRequest) {
  try {
    console.log('🔵 Quote submission started...');
    
    const authHeader = request.headers.get('authorization');
    console.log('🔵 Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('🔴 No Bearer token found');
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔵 Token length:', token.length);
    
    let userInfo;
    try {
      userInfo = verifyToken(token);
      console.log('🔵 Decoded user info:', userInfo);
    } catch (tokenError) {
      console.log('🔴 Token verification failed:', tokenError);
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const sellerId = parseInt(userInfo.userId, 10);
    console.log('🔵 Seller ID:', sellerId);

    let body;
    try {
      body = await request.json();
      console.log('🔵 Request body received:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.log('🔴 JSON parse error:', parseError);
      return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { 
      requestId, 
      price, 
      availability, 
      deliveryTime, 
      notes, 
      warranty, 
      condition 
    } = body;

    console.log('🔵 Extracted fields:', {
      requestId,
      price,
      availability,
      deliveryTime,
      notes,
      warranty,
      condition
    });

    // Validate required fields
    if (!requestId || !price) {
      console.log('🔴 Missing required fields:', { requestId, price });
      return NextResponse.json({ 
        success: false, 
        error: 'Request ID and price are required' 
      }, { status: 400 });
    }

    console.log('🔵 Checking for existing quote...');
    
    // Check if seller already quoted this request
    let existingQuote;
    try {
      existingQuote = await query(
        'SELECT id FROM request_quotes WHERE request_id = $1 AND seller_id = $2',
        [requestId, sellerId]
      );
      console.log('🔵 Existing quote check result:', existingQuote.rows);
    } catch (dbError) {
      console.log('🔴 Database error in existing quote check:', dbError);
      return NextResponse.json({ 
        success: false, 
        error: 'Database error while checking existing quotes' 
      }, { status: 500 });
    }

    if (existingQuote.rows.length > 0) {
      console.log('🔴 Quote already exists for this request');
      return NextResponse.json({ 
        success: false, 
        error: 'You have already submitted a quote for this request' 
      }, { status: 400 });
    }

    console.log('🔵 Inserting new quote...');
    
    // Insert the quote
    let result;
    try {
      result = await query(
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
      console.log('🟢 Quote inserted successfully. ID:', result.rows[0]?.id);


      // After quote insert, BEFORE return response
const quoteId = result.rows[0].id;
debugger;
//  ADD THIS - Get buyer details
const buyerData = await query(
  `SELECT u.id, u.name, u.phone, pr.part_name 
   FROM part_requests pr
   JOIN users u ON pr.user_id = u.id
   WHERE pr.id = $1`,
  [requestId]
);

const buyer = buyerData.rows[0];
debugger;
console.log('🔵 Buyer details fetched:', buyer);
//  ADD THIS - Send SMS to buyer
if (buyer?.phone) {
  const message = `${userInfo.name || 'A seller'} sent J$${price} quote for ${buyer.part_name}. Check Partify app now.`;
  
  await smsQueueService.queueSms({
    userId: buyer.id,
    phone: buyer.phone,
    message: message,
    type: 'new_quote',
    referenceId: quoteId.toString()
  });
  
  console.log('📱 SMS queued for buyer');
}


    } catch (insertError) {
      console.log('🔴 Database insert error:', insertError);
      console.log('🔴 Insert error details:', {
        message: insertError.message,
        code: insertError.code,
        detail: insertError.detail,
        constraint: insertError.constraint
      });
      return NextResponse.json({
        success: false,
        error: `Database insert failed: ${insertError.message}`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        quoteId: result.rows[0].id,
        message: 'Quote submitted successfully'
      }
    });

  } catch (error: any) {
    console.error('🔴 Unexpected error in POST handler:', error);
    console.error('🔴 Error stack:', error.stack);
    console.error('🔴 Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
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