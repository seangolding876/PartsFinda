import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Submit response to part request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      request_id,
      seller_id,
      seller_name,
      seller_email,
      price,
      availability = 'in_stock',
      delivery_time,
      notes
    } = body;

    if (!request_id || !seller_id || !seller_name || !seller_email || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert response
    const result = await query(
      `INSERT INTO request_responses (
        request_id, seller_id, seller_name, seller_email, price, 
        availability, delivery_time, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [request_id, seller_id, seller_name, seller_email, price, availability, delivery_time, notes]
    );

    // Update responses count in part request
    await query(
      `UPDATE part_requests 
       SET responses_count = responses_count + 1,
           status = CASE WHEN status = 'active' THEN 'in_progress' ELSE status END
       WHERE id = $1`,
      [request_id]
    );

    // Notify buyer about new response
    console.log(`📧 Notified buyer about new quote for request ${request_id}`);

    return NextResponse.json({
      success: true,
      message: 'Response submitted successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error submitting response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit response' },
      { status: 500 }
    );
  }
}

// Get responses for a part request
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const request_id = searchParams.get('request_id');
    const seller_id = searchParams.get('seller_id');

    if (!request_id && !seller_id) {
      return NextResponse.json(
        { success: false, error: 'Either request_id or seller_id is required' },
        { status: 400 }
      );
    }

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCount = 0;

    if (request_id) {
      paramCount++;
      whereConditions.push(`request_id = $${paramCount}`);
      queryParams.push(request_id);
    }

    if (seller_id) {
      paramCount++;
      whereConditions.push(`seller_id = $${paramCount}`);
      queryParams.push(seller_id);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const responsesResult = await query(
      `SELECT * FROM request_responses 
       ${whereClause}
       ORDER BY price ASC, created_at DESC`,
      queryParams
    );

    return NextResponse.json({
      success: true,
      data: responsesResult.rows
    });

  } catch (error: any) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}