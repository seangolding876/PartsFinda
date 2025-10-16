// app/api/quotes/submit/route.ts (example)
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
    
    const { requestId, price, deliveryTime, condition, notes } = await request.json();

    // Insert quote into database
    const quoteResult = await query(
      `INSERT INTO request_quotes 
       (request_id, seller_id, price, delivery_time, condition, notes, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') 
       RETURNING *`,
      [requestId, userInfo.userId, price, deliveryTime, condition, notes]
    );

    const newQuote = quoteResult.rows[0];

    // Get buyer info and part request details
    const requestInfo = await query(
      `SELECT pr.*, u.id as buyer_id, u.email as buyer_email, u.name as buyer_name,
              m.name as make_name, md.name as model_name
       FROM part_requests pr
       INNER JOIN users u ON pr.user_id = u.id
       LEFT JOIN makes m ON pr.make_id = m.id
       LEFT JOIN models md ON pr.model_id = md.id
       WHERE pr.id = $1`,
      [requestId]
    );

    if (requestInfo.rows.length > 0) {
      const partRequest = requestInfo.rows[0];
      const sellerInfo = await query(
        'SELECT name, business_name FROM users WHERE id = $1',
        [userInfo.userId]
      );

      const sellerName = sellerInfo.rows[0]?.business_name || sellerInfo.rows[0]?.name;

      // Send email notification to buyer
      try {
        await fetch(`${process.env.NEXTAUTH_URL}/api/email/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_quote',
            userId: partRequest.buyer_id,
            data: {
              partName: partRequest.part_name,
              sellerName: sellerName,
              price: price,
              deliveryTime: deliveryTime,
              condition: condition,
              notes: notes,
              vehicle: `${partRequest.make_name} ${partRequest.model_name} (${partRequest.vehicle_year})`
            }
          })
        });
      } catch (emailError) {
        console.error('❌ Failed to send new quote email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      data: newQuote,
      message: 'Quote submitted successfully'
    });

  } catch (error: any) {
    console.error('Error submitting quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit quote' },
      { status: 500 }
    );
  }
}