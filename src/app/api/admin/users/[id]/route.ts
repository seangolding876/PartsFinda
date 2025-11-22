import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (role === 'seller') {
      // Seller stats
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

      return NextResponse.json({
        success: true,
        data: {
          total_part_requests: parseInt(partRequestsResult.rows[0]?.count || 0),
          total_quotes_sent: parseInt(quotesResult.rows[0]?.count || 0),
          accepted_quotes: parseInt(acceptedQuotesResult.rows[0]?.count || 0),
          total_revenue: parseFloat(revenueResult.rows[0]?.total || 0),
          active_subscription: subscriptionResult.rows[0] || null,
          payment_history: paymentsResult.rows
        }
      });
    } else {
      // Buyer stats
      const [
        totalRequestsResult,
        openRequestsResult,
        fulfilledRequestsResult,
        quotesReceivedResult,
        acceptedQuotesResult,
        totalSpentResult
      ] = await Promise.all([
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
           JOIN part_requests pr ON p.user_id = pr.user_id
           WHERE p.user_id = $1 AND p.status = 'completed'`,
          [userId]
        )
      ]);

      return NextResponse.json({
        success: true,
        data: {
          total_part_requests: parseInt(totalRequestsResult.rows[0]?.count || 0),
          open_requests: parseInt(openRequestsResult.rows[0]?.count || 0),
          fulfilled_requests: parseInt(fulfilledRequestsResult.rows[0]?.count || 0),
          total_quotes_received: parseInt(quotesReceivedResult.rows[0]?.count || 0),
          accepted_quotes: parseInt(acceptedQuotesResult.rows[0]?.count || 0),
          total_spent: parseFloat(totalSpentResult.rows[0]?.total || 0)
        }
      });
    }
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}



// DELETE - Delete user by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // console.log('🗑️ DELETE User API Called');
    
    const userId = parseInt(params.id);
    // console.log('🔢 User ID to delete:', userId);

    if (isNaN(userId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid user ID',
          details: `Provided ID: ${params.id} is not a valid number`
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const userCheck = await query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found',
          details: `User with ID ${userId} does not exist`
        },
        { status: 404 }
      );
    }

    const user = userCheck.rows[0];
    // console.log('👤 User to delete:', user.email, 'Role:', user.role);

    // Start a transaction for safe deletion
    await query('BEGIN');

    try {
      // Based on user role, handle related data
      if (user.role === 'seller') {
        // Delete seller related data
        await query(
          'DELETE FROM request_quotes WHERE seller_id = $1',
          [userId]
        );
        await query(
          'DELETE FROM supplier_subscription WHERE user_id = $1',
          [userId]
        );
        // Add other seller-related tables if needed
      } else if (user.role === 'buyer') {
        // Delete buyer related data
        await query(
          'DELETE FROM part_requests WHERE user_id = $1',
          [userId]
        );
        // Add other buyer-related tables if needed
      }

      // Delete user from main users table
      const deleteResult = await query(
        'DELETE FROM users WHERE id = $1 RETURNING id, email',
        [userId]
      );

      await query('COMMIT');

      // console.log('✅ User deleted successfully:', deleteResult.rows[0]);

      return NextResponse.json({
        success: true,
        data: {
          deletedUser: deleteResult.rows[0],
          message: 'User deleted successfully'
        }
      });

    } catch (transactionError: any) {
      await query('ROLLBACK');
      console.error('❌ Transaction failed:', transactionError);
      throw transactionError;
    }

  } catch (error: any) {
    console.error('💥 Error deleting user:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete user',
        details: error.message,
        type: 'DELETE_ERROR'
      },
      { status: 500 }
    );
  }
}