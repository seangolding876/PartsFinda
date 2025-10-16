// app/api/quotes/request/[requestId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const requestId = params.requestId;

    const quotesResult = await query(
      `SELECT 
        rq.*,
        u.name as seller_name,
        u.business_name as seller_company
       FROM request_quotes rq
       INNER JOIN part_requests pr ON rq.request_id = pr.id
       LEFT JOIN users u ON rq.seller_id = u.id
       WHERE pr.user_id = $1 AND rq.request_id = $2
       ORDER BY rq.created_at DESC`,
      [userInfo.userId, requestId]
    );

    return NextResponse.json({
      success: true,
      data: quotesResult.rows
    });

  } catch (error: any) {
    console.error('Error fetching request quotes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}