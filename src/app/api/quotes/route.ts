import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

// GET - Buyer ke liye quotes fetch karna
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    
    // Buyer ke part requests ke saare quotes fetch karenge
    const quotesResult = await query(
      `SELECT 
        rq.*,
        pr.part_name,
        pr.part_number,
        pr.description as request_description,
        pr.condition as requested_condition,
        pr.budget as requested_budget,
        u.name as seller_name,
        u.email as seller_email,
        u.business_name as seller_company,
        m.name as make_name,
        md.name as model_name
       FROM request_quotes rq
       INNER JOIN part_requests pr ON rq.request_id = pr.id
       LEFT JOIN users u ON rq.seller_id = u.id
       LEFT JOIN makes m ON pr.make_id = m.id
       LEFT JOIN models md ON pr.model_id = md.id
       WHERE pr.user_id = $1
       ORDER BY rq.created_at DESC`,
      [userInfo.userId]
    );

    return NextResponse.json({
      success: true,
      data: quotesResult.rows
    });

  } catch (error: any) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}