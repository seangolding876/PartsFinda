import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// ✅ Simple dynamic export
export const dynamic = 'force-dynamic';

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
    const { requestId, price, availability, deliveryTime } = body;

    // Simple validation
    if (!requestId || !price || !availability || !deliveryTime) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Simple quote insertion
    const quoteResult = await query(
      `INSERT INTO request_quotes (request_id, seller_id, price, availability, delivery_time, status) 
       VALUES ($1, $2, $3, $4, $5, 'submitted') 
       RETURNING id`,
      [requestId, sellerId, price, availability, deliveryTime]
    );

    return NextResponse.json({
      success: true,
      message: 'Quote submitted successfully',
      data: { quoteId: quoteResult.rows[0].id }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to submit quote'
    }, { status: 500 });
  }
}