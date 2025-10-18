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
    const { conversationId, ratedUserId, rating, comment } = await request.json();

    console.log('📝 Rating submission:', { conversationId, ratedUserId, rating, comment, raterId: userInfo.userId });

    // Validation
    if (!conversationId || !ratedUserId || !rating) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if conversation exists and user is participant
    const convCheck = await query(
      `SELECT id, buyer_id, seller_id FROM conversations 
       WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
      [conversationId, userInfo.userId]
    );

    if (convCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found or unauthorized' },
        { status: 404 }
      );
    }

    const conversation = convCheck.rows[0];
    
    // Verify rated user is part of conversation
    const ratedUserIdInt = parseInt(ratedUserId);
    const raterIdInt = parseInt(userInfo.userId);
    
    if (ratedUserIdInt !== conversation.buyer_id && ratedUserIdInt !== conversation.seller_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid user to rate' },
        { status: 400 }
      );
    }

    // Cannot rate yourself
    if (ratedUserIdInt === raterIdInt) {
      return NextResponse.json(
        { success: false, error: 'You cannot rate yourself' },
        { status: 400 }
      );
    }

    // Check if already rated
    const existingRating = await query(
      `SELECT id FROM ratings WHERE conversation_id = $1 AND rater_id = $2`,
      [conversationId, raterIdInt]
    );

    if (existingRating.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'You have already rated this conversation' },
        { status: 400 }
      );
    }

    // Insert rating
    const result = await query(
      `INSERT INTO ratings (conversation_id, rater_id, rated_user_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, rating, comment, created_at`,
      [conversationId, raterIdInt, ratedUserIdInt, rating, comment || null]
    );

    console.log('✅ Rating inserted:', result.rows[0]);

    // Update user's average rating
    await updateUserRating(ratedUserIdInt);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Rating submitted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error submitting rating:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit rating: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    let queryStr = '';
    let params = [];

    if (conversationId) {
      // Get ratings for specific conversation
      queryStr = `
        SELECT r.*, 
               u.name as rater_name,
               u.business_name as rater_business_name,
               u.avatar_url as rater_avatar
        FROM ratings r
        JOIN users u ON r.rater_id = u.id
        WHERE r.conversation_id = $1
        ORDER BY r.created_at DESC
      `;
      params = [conversationId];
    } else if (userId) {
      // Get all ratings for a user
      queryStr = `
        SELECT r.*, 
               u.name as rater_name,
               u.business_name as rater_business_name,
               u.avatar_url as rater_avatar,
               c.id as conversation_id
        FROM ratings r
        JOIN users u ON r.rater_id = u.id
        LEFT JOIN conversations c ON r.conversation_id = c.id
        WHERE r.rated_user_id = $1
        ORDER BY r.created_at DESC
        LIMIT 50
      `;
      params = [parseInt(userId)];
    } else {
      return NextResponse.json(
        { success: false, error: 'conversationId or userId required' },
        { status: 400 }
      );
    }

    const result = await query(queryStr, params);

    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    console.error('❌ Error fetching ratings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ratings: ' + error.message },
      { status: 500 }
    );
  }
}

// Check if user can rate
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'conversationId required' },
        { status: 400 }
      );
    }

    // Check if user has already rated this conversation
    const existingRating = await query(
      `SELECT id FROM ratings WHERE conversation_id = $1 AND rater_id = $2`,
      [conversationId, parseInt(userInfo.userId)]
    );

    // Check conversation details
    const convResult = await query(
      `SELECT buyer_id, seller_id FROM conversations WHERE id = $1`,
      [conversationId]
    );

    if (convResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const conversation = convResult.rows[0];
    const currentUserId = parseInt(userInfo.userId);
    
    // Determine who to rate (the other participant)
    const userToRate = currentUserId === conversation.buyer_id ? conversation.seller_id : conversation.buyer_id;

    return NextResponse.json({
      success: true,
      data: {
        canRate: existingRating.rows.length === 0,
        alreadyRated: existingRating.rows.length > 0,
        userToRate: userToRate,
        currentUser: currentUserId
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking rating status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check rating status: ' + error.message },
      { status: 500 }
    );
  }
}

// Helper function to update user's average rating
async function updateUserRating(userId: number) {
  try {
    const avgResult = await query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count 
       FROM ratings WHERE rated_user_id = $1`,
      [userId]
    );

    const avgRating = parseFloat(avgResult.rows[0]?.avg_rating) || 0;
    const ratingCount = parseInt(avgResult.rows[0]?.rating_count) || 0;

    // Update users table
    await query(
      `UPDATE users SET avg_rating = $1, total_ratings = $2 WHERE id = $3`,
      [avgRating, ratingCount, userId]
    );

    console.log(`✅ Updated user ${userId} rating: ${avgRating} (${ratingCount} ratings)`);

  } catch (error) {
    console.error('❌ Error updating user rating:', error);
  }
}