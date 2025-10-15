import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

// GET - Buyer ke liye quotes fetch karna
export async function GET(request: NextRequest) {
  console.log('🔍 Quotes API called');
  
  try {
    // 1. Authorization check
    const authHeader = request.headers.get('authorization');
    console.log('📝 Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ No authorization header');
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token received');
    
    // 2. Token verification
    let userInfo;
    try {
      userInfo = verifyToken(token);
      console.log('✅ Token verified, user ID:', userInfo.userId);
    } catch (tokenError: any) {
      console.log('❌ Token verification failed:', tokenError.message);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token: ' + tokenError.message 
      }, { status: 401 });
    }

    // 3. Database query with better error handling
    console.log('🗄️ Executing database query for user:', userInfo.userId);
    
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

    console.log('✅ Query successful, rows found:', quotesResult.rows.length);
    
    // Data formatting check
    const formattedQuotes = quotesResult.rows.map(quote => ({
      ...quote,
      price: quote.price ? parseFloat(quote.price) : null,
      requested_budget: quote.requested_budget ? parseFloat(quote.requested_budget) : null
    }));

    return NextResponse.json({
      success: true,
      data: formattedQuotes,
      count: formattedQuotes.length
    });

  } catch (error: any) {
    console.error('❌ Error in quotes API:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    
    // Specific error messages
    let errorMessage = 'Failed to fetch quotes';
    let statusCode = 500;

    if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Database connection failed';
      statusCode = 503;
    } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
      errorMessage = 'Database table not found - please check table names';
      statusCode = 500;
    } else if (error.message.includes('column') && error.message.includes('does not exist')) {
      errorMessage = 'Database column not found - please check column names';
      statusCode = 500;
    } else if (error.message.includes('permission denied')) {
      errorMessage = 'Database permission denied';
      statusCode = 500;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    );
  }
}