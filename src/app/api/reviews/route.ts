import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const { conversationId, rating, comment, reviewedUserId } = await request.json();

    // Verify user is part of conversation
    const convCheck = await query(
      'SELECT id FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [conversationId, userInfo.userId]
    );

    if (convCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Not part of this conversation' },
        { status: 403 }
      );
    }

    // Check if already reviewed
    const existingReview = await query(
      'SELECT id FROM reviews WHERE conversation_id = $1 AND reviewer_id = $2',
      [conversationId, userInfo.userId]
    );

    if (existingReview.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Already reviewed this conversation' },
        { status: 400 }
      );
    }

    // Create review
    const result = await query(
      `INSERT INTO reviews (reviewer_id, reviewed_user_id, conversation_id, rating, comment) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userInfo.userId, reviewedUserId, conversationId, rating, comment]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const reviews = await query(
      `SELECT r.*, u.name as reviewer_name, u.business_name as reviewer_business
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewed_user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      data: reviews.rows
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}