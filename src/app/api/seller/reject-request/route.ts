import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 Reject request started...');

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('🔴 No Bearer token');
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    let userInfo;
    try {
      userInfo = verifyToken(token);
      console.log('🔵 Seller info:', userInfo);
    } catch (err) {
      console.log('🔴 Token verification failed:', err);
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const sellerId = parseInt(userInfo.userId, 10);
    console.log('🔵 Seller ID:', sellerId);

    let body;
    try {
      body = await request.json();
      console.log('🔵 Request body:', body);
    } catch (err) {
      console.log('🔴 Failed to parse JSON:', err);
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const { request_id } = body;
    if (!request_id) {
      console.log('🔴 Missing request_id');
      return NextResponse.json({ success: false, error: 'request_id is required' }, { status: 400 });
    }

    // ✅ Update request_queue
    let result;
    try {
      result = await query(
        `UPDATE request_queue
         SET "isReject" = $1, "RejectOn" = NOW()
         WHERE id = $2 AND seller_id = $3
         RETURNING id, "isReject", "RejectOn"`,
        [true, request_id, sellerId]
      );
      console.log('🟢 Update result:', result.rows);
    } catch (dbError) {
      console.log('🔴 Database update error:', dbError);
      return NextResponse.json({ success: false, error: 'Failed to update request' }, { status: 500 });
    }

    if (result.rows.length === 0) {
      console.log('🔴 No matching request found or already rejected');
      return NextResponse.json({ success: false, error: 'Request not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Request rejected successfully'
    });

  } catch (error: any) {
    console.error('🔴 Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
