// app/api/quotes/reject/route.ts
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

    // Verify that quote exists and belongs to buyer's request
    const quoteCheck = await query(
      `SELECT rq.*, pr.user_id as buyer_id 
       FROM request_quotes rq
       INNER JOIN part_requests pr ON rq.request_id = pr.id
       WHERE rq.id = $1 AND pr.user_id = $2`,
      [quoteId, userInfo.userId]
    );

    if (quoteCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Quote not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update quote status to 'rejected'
    await query(
      'UPDATE request_quotes SET status = $1 WHERE id = $2',
      ['rejected', quoteId]
    );

    console.log('✅ Quote rejected successfully:', quoteId);

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