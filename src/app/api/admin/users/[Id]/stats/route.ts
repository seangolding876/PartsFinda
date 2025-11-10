// app/api/admin/users/[id]/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let userId: number;
  
  try {
    console.log('🚀 API Route Started ======================');
    
    // Parse and validate user ID
    userId = parseInt(params.id);
    console.log(`📝 Raw params:`, params);
    console.log(`🔢 Parsed User ID: ${userId}`);
    
    if (isNaN(userId)) {
      console.error('❌ Invalid user ID:', params.id);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid user ID',
          details: `Provided ID: ${params.id} is not a valid number`
        },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    console.log(`🎯 Role parameter: ${role}`);
    console.log(`🔗 Full URL: ${request.url}`);

    // Validate role
    if (!role) {
      console.error('❌ Missing role parameter');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Role parameter is required',
          details: 'Add ?role=buyer or ?role=seller to the URL'
        },
        { status: 400 }
      );
    }

    if (role === 'seller') {
      console.log('🛍️ Processing seller stats...');
      
      try {
        const [
          partRequestsResult,
          quotesResult,
          acceptedQuotesResult,
          revenueResult,
          subscriptionResult,
          paymentsResult
        ] = await Promise.all([
          query(
            `SELECT COUNT(*) as count FROM part_requests pr 
             WHERE pr.user_id = $1`,
            [userId]
          ),
          query(
            `SELECT COUNT(*) as count FROM request_quotes rq 
             WHERE rq.seller_id = $1`,
            [userId]
          ),
          query(
            `SELECT COUNT(*) as count FROM request_quotes rq 
             WHERE rq.seller_id = $1 AND rq.status = 'accepted'`,
            [userId]
          ),
          query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM payments 
             WHERE user_id = $1 AND status = 'completed'`,
            [userId]
          ),
          query(
            `SELECT * FROM supplier_subscription 
             WHERE user_id = $1 AND is_active = true 
             ORDER BY created_at DESC LIMIT 1`,
            [userId]
          ),
          query(
            `SELECT * FROM payments 
             WHERE user_id = $1 
             ORDER BY created_at DESC LIMIT 10`,
            [userId]
          )
        ]);

        console.log('✅ Seller queries executed successfully');
        console.log('📊 Seller Results:', {
          partRequests: partRequestsResult.rows[0],
          quotes: quotesResult.rows[0],
          acceptedQuotes: acceptedQuotesResult.rows[0],
          revenue: revenueResult.rows[0],
          subscription: subscriptionResult.rows[0],
          payments: paymentsResult.rows
        });

        const responseData = {
          total_part_requests: parseInt(partRequestsResult.rows[0]?.count || 0),
          total_quotes_sent: parseInt(quotesResult.rows[0]?.count || 0),
          accepted_quotes: parseInt(acceptedQuotesResult.rows[0]?.count || 0),
          total_revenue: parseFloat(revenueResult.rows[0]?.total || 0),
          active_subscription: subscriptionResult.rows[0] || null,
          payment_history: paymentsResult.rows
        };

        console.log('🎉 Seller stats successfully generated');
        return NextResponse.json({
          success: true,
          data: responseData
        });

      } catch (sellerError: any) {
        console.error('❌ Seller query error:', sellerError);
        throw new Error(`Seller queries failed: ${sellerError.message}`);
      }

    } else {
      console.log('🛒 Processing buyer stats...');
      
      try {
        // Test connection with a simple query first
        console.log('🧪 Testing database connection...');
        const testQuery = await query('SELECT NOW() as current_time', []);
        console.log('✅ Database connection test passed:', testQuery.rows[0]);

        // Execute all buyer queries
        const queryPromises = [
          query(
            `SELECT COUNT(*) as count FROM part_requests WHERE user_id = $1`,
            [userId]
          ),
          query(
            `SELECT COUNT(*) as count FROM part_requests 
             WHERE user_id = $1 AND status = 'open'`,
            [userId]
          ),
          query(
            `SELECT COUNT(*) as count FROM part_requests 
             WHERE user_id = $1 AND status = 'fulfilled'`,
            [userId]
          ),
          query(
            `SELECT COUNT(*) as count FROM request_quotes rq
             JOIN part_requests pr ON rq.request_id = pr.id
             WHERE pr.user_id = $1`,
            [userId]
          ),
          query(
            `SELECT COUNT(*) as count FROM request_quotes rq
             JOIN part_requests pr ON rq.request_id = pr.id
             WHERE pr.user_id = $1 AND rq.status = 'accepted'`,
            [userId]
          ),
          query(
            `SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p
             WHERE p.user_id = $1 AND p.status = 'completed'`,
            [userId]
          )
        ];

        console.log('📨 Executing buyer queries...');
        const [
          totalRequestsResult,
          openRequestsResult,
          fulfilledRequestsResult,
          quotesReceivedResult,
          acceptedQuotesResult,
          totalSpentResult
        ] = await Promise.all(queryPromises);

        console.log('✅ All buyer queries executed successfully');
        console.log('📊 Buyer Query Results:', {
          totalRequests: totalRequestsResult.rows[0],
          openRequests: openRequestsResult.rows[0],
          fulfilledRequests: fulfilledRequestsResult.rows[0],
          quotesReceived: quotesReceivedResult.rows[0],
          acceptedQuotes: acceptedQuotesResult.rows[0],
          totalSpent: totalSpentResult.rows[0]
        });

        // Process results
        const statsData = {
          total_part_requests: parseInt(totalRequestsResult.rows[0]?.count || 0),
          open_requests: parseInt(openRequestsResult.rows[0]?.count || 0),
          fulfilled_requests: parseInt(fulfilledRequestsResult.rows[0]?.count || 0),
          total_quotes_received: parseInt(quotesReceivedResult.rows[0]?.count || 0),
          accepted_quotes: parseInt(acceptedQuotesResult.rows[0]?.count || 0),
          total_spent: parseFloat(totalSpentResult.rows[0]?.total || 0)
        };

        console.log('📈 Final buyer stats:', statsData);
        console.log('🎉 Buyer stats successfully generated');

        return NextResponse.json({
          success: true,
          data: statsData
        });

      } catch (buyerError: any) {
        console.error('❌ Buyer query error:', buyerError);
        throw new Error(`Buyer queries failed: ${buyerError.message}`);
      }
    }

  } catch (error: any) {
    console.error('💥 CRITICAL ERROR in API route:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('User ID attempted:', userId);
    
    // Database connection errors
    if (error.message?.includes('connection') || error.message?.includes('database')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          details: error.message,
          type: 'DATABASE_CONNECTION_ERROR'
        },
        { status: 500 }
      );
    }
    
    // Query syntax errors
    if (error.message?.includes('syntax') || error.message?.includes('SQL')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database query error',
          details: error.message,
          type: 'QUERY_SYNTAX_ERROR'
        },
        { status: 500 }
      );
    }
    
    // Generic error
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user stats',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        type: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  } finally {
    console.log('🏁 API Route Completed ======================\n');
  }
}