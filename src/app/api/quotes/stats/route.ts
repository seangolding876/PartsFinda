// app/api/quotes/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    
    // Total quotes count for buyer
    const quotesCountResult = await query(
      `SELECT COUNT(*) as total_quotes
       FROM request_quotes rq
       INNER JOIN part_requests pr ON rq.request_id = pr.id
       WHERE pr.user_id = $1 AND rq.status = 'pending'`,
      [userInfo.userId]
    );

    // Pending quotes count (unread/not accepted)
    const pendingQuotesResult = await query(
      `SELECT COUNT(*) as pending_quotes
       FROM request_quotes rq
       INNER JOIN part_requests pr ON rq.request_id = pr.id
       WHERE pr.user_id = $1 AND rq.status = 'pending'`,
      [userInfo.userId]
    );

    return NextResponse.json({
      success: true,
      data: {
        totalQuotes: parseInt(quotesCountResult.rows[0]?.total_quotes || '0'),
        pendingQuotes: parseInt(pendingQuotesResult.rows[0]?.pending_quotes || '0')
      }
    });

  } catch (error: any) {
    console.error('Error fetching quotes stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotes stats' },
      { status: 500 }
    );
  }
}