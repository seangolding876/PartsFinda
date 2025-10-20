import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    console.log('🔹 [POST] Starting rating submission API...');
    
    const authHeader = request.headers.get('authorization');
    console.log('🔹 [POST] Auth header exists:', !!authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ [POST] No Bearer token in auth header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔹 [POST] Token extracted, length:', token.length);
    
    let userInfo;
    try {
      userInfo = verifyToken(token);
      console.log('🔹 [POST] Token verified, user ID:', userInfo.userId);
    } catch (tokenError: any) {
      console.error('❌ [POST] Token verification failed:', tokenError.message);
      console.error('❌ [POST] Token verification stack:', tokenError.stack);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let requestBody;
    try {
      requestBody = await request.json();
      console.log('🔹 [POST] Request body parsed successfully:', requestBody);
    } catch (parseError: any) {
      console.error('❌ [POST] JSON parsing failed:', parseError.message);
      console.error('❌ [POST] JSON parsing stack:', parseError.stack);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { conversationId, ratedUserId, rating, comment } = requestBody;

    console.log('📝 [POST] Rating submission details:', { 
      conversationId, 
      ratedUserId, 
      rating, 
      comment, 
      raterId: userInfo.userId 
    });

    // Validation
    if (!conversationId || !ratedUserId || !rating) {
      console.error('❌ [POST] Missing required fields:', { conversationId, ratedUserId, rating });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      console.error('❌ [POST] Invalid rating value:', rating);
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if conversation exists and user is participant
    console.log('🔹 [POST] Checking conversation access...');
    let convCheck;
    try {
      convCheck = await query(
        `SELECT id, buyer_id, seller_id FROM conversations 
         WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
        [conversationId, userInfo.userId]
      );
      console.log('🔹 [POST] Conversation check result rows:', convCheck.rows.length);
    } catch (dbError: any) {
      console.error('❌ [POST] Database query failed - conversation check:');
      console.error('❌ [POST] DB Error message:', dbError.message);
      console.error('❌ [POST] DB Error stack:', dbError.stack);
      console.error('❌ [POST] Query parameters:', [conversationId, userInfo.userId]);
      throw new Error(`Database query failed: ${dbError.message}`);
    }

    if (convCheck.rows.length === 0) {
      console.error('❌ [POST] Conversation not found or unauthorized');
      return NextResponse.json(
        { success: false, error: 'Conversation not found or unauthorized' },
        { status: 404 }
      );
    }

    const conversation = convCheck.rows[0];
    console.log('🔹 [POST] Conversation found:', conversation);
    
    // Verify rated user is part of conversation
    let ratedUserIdInt, raterIdInt;
    try {
      ratedUserIdInt = parseInt(ratedUserId);
      raterIdInt = parseInt(userInfo.userId);
      console.log('🔹 [POST] Parsed user IDs - rater:', raterIdInt, 'rated:', ratedUserIdInt);
    } catch (parseError: any) {
      console.error('❌ [POST] User ID parsing failed:');
      console.error('❌ [POST] Parse error:', parseError.message);
      console.error('❌ [POST] ratedUserId:', ratedUserId, 'userInfo.userId:', userInfo.userId);
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    if (ratedUserIdInt !== conversation.buyer_id && ratedUserIdInt !== conversation.seller_id) {
      console.error('❌ [POST] Invalid user to rate:', {
        ratedUserIdInt,
        buyer_id: conversation.buyer_id,
        seller_id: conversation.seller_id
      });
      return NextResponse.json(
        { success: false, error: 'Invalid user to rate' },
        { status: 400 }
      );
    }

    // Cannot rate yourself
    if (ratedUserIdInt === raterIdInt) {
      console.error('❌ [POST] User tried to rate themselves');
      return NextResponse.json(
        { success: false, error: 'You cannot rate yourself' },
        { status: 400 }
      );
    }

    // Check if already rated
    console.log('🔹 [POST] Checking for existing rating...');
    let existingRating;
    try {
      existingRating = await query(
        `SELECT id FROM ratings WHERE conversation_id = $1 AND rater_id = $2`,
        [conversationId, raterIdInt]
      );
      console.log('🔹 [POST] Existing rating check rows:', existingRating.rows.length);
    } catch (dbError: any) {
      console.error('❌ [POST] Database query failed - existing rating check:');
      console.error('❌ [POST] DB Error message:', dbError.message);
      console.error('❌ [POST] DB Error stack:', dbError.stack);
      throw new Error(`Database query failed: ${dbError.message}`);
    }

    if (existingRating.rows.length > 0) {
      console.error('❌ [POST] User already rated this conversation');
      return NextResponse.json(
        { success: false, error: 'You have already rated this conversation' },
        { status: 400 }
      );
    }

    // Insert rating
    console.log('🔹 [POST] Inserting new rating...');
    let result;
    try {
      result = await query(
        `INSERT INTO ratings (conversation_id, rater_id, rated_user_id, rating, comment)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, rating, comment, created_at`,
        [conversationId, raterIdInt, ratedUserIdInt, rating, comment || null]
      );
      console.log('✅ [POST] Rating inserted successfully:', result.rows[0]);
    } catch (dbError: any) {
      console.error('❌ [POST] Database insert failed:');
      console.error('❌ [POST] DB Error message:', dbError.message);
      console.error('❌ [POST] DB Error stack:', dbError.stack);
      console.error('❌ [POST] Insert parameters:', [conversationId, raterIdInt, ratedUserIdInt, rating, comment || null]);
      throw new Error(`Rating insertion failed: ${dbError.message}`);
    }

    // Update user's average rating
    console.log('🔹 [POST] Updating user average rating...');
    try {
      await updateUserRating(ratedUserIdInt);
      console.log('✅ [POST] User rating updated successfully');
    } catch (updateError: any) {
      console.error('❌ [POST] User rating update failed (non-critical):', updateError.message);
      // Don't fail the whole request if just the average update fails
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Rating submitted successfully'
    });

  } catch (error: any) {
    console.error('❌ [POST] CRITICAL ERROR - Rating submission failed:');
    console.error('❌ [POST] Error name:', error.name);
    console.error('❌ [POST] Error message:', error.message);
    console.error('❌ [POST] Full error stack:', error.stack);
    console.error('❌ [POST] Error occurred at:', new Date().toISOString());
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit rating: ' + error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔹 [GET] Starting ratings fetch API...');
    
    const authHeader = request.headers.get('authorization');
    console.log('🔹 [GET] Auth header exists:', !!authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ [GET] No Bearer token in auth header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔹 [GET] Token extracted, length:', token.length);
    
    let userInfo;
    try {
      userInfo = verifyToken(token);
      console.log('🔹 [GET] Token verified, user ID:', userInfo.userId);
    } catch (tokenError: any) {
      console.error('❌ [GET] Token verification failed:', tokenError.message);
      console.error('❌ [GET] Token verification stack:', tokenError.stack);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    console.log('🔹 [GET] Query parameters:', { conversationId, userId });

    let queryStr = '';
    let params = [];

    if (conversationId) {
      console.log('🔹 [GET] Fetching ratings for conversation:', conversationId);
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
      console.log('🔹 [GET] Fetching ratings for user:', userId);
      let parsedUserId;
      try {
        parsedUserId = parseInt(userId);
        console.log('🔹 [GET] Parsed user ID:', parsedUserId);
      } catch (parseError: any) {
        console.error('❌ [GET] User ID parsing failed:', parseError.message);
        return NextResponse.json(
          { success: false, error: 'Invalid user ID format' },
          { status: 400 }
        );
      }
      
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
      params = [parsedUserId];
    } else {
      console.error('❌ [GET] Missing conversationId or userId parameter');
      return NextResponse.json(
        { success: false, error: 'conversationId or userId required' },
        { status: 400 }
      );
    }

    console.log('🔹 [GET] Executing query with params:', params);
    let result;
    try {
      result = await query(queryStr, params);
      console.log('✅ [GET] Query successful, rows found:', result.rows.length);
    } catch (dbError: any) {
      console.error('❌ [GET] Database query failed:');
      console.error('❌ [GET] DB Error message:', dbError.message);
      console.error('❌ [GET] DB Error stack:', dbError.stack);
      console.error('❌ [GET] Query:', queryStr);
      console.error('❌ [GET] Parameters:', params);
      throw new Error(`Database query failed: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    console.error('❌ [GET] CRITICAL ERROR - Ratings fetch failed:');
    console.error('❌ [GET] Error name:', error.name);
    console.error('❌ [GET] Error message:', error.message);
    console.error('❌ [GET] Full error stack:', error.stack);
    console.error('❌ [GET] Error occurred at:', new Date().toISOString());
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch ratings: ' + error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Check if user can rate
export async function PUT(request: NextRequest) {
  try {
    console.log('🔹 [PUT] Starting rating status check API...');
    
    const authHeader = request.headers.get('authorization');
    console.log('🔹 [PUT] Auth header exists:', !!authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ [PUT] No Bearer token in auth header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔹 [PUT] Token extracted, length:', token.length);
    
    let userInfo;
    try {
      userInfo = verifyToken(token);
      console.log('🔹 [PUT] Token verified, user ID:', userInfo.userId);
    } catch (tokenError: any) {
      console.error('❌ [PUT] Token verification failed:', tokenError.message);
      console.error('❌ [PUT] Token verification stack:', tokenError.stack);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let requestBody;
    try {
      requestBody = await request.json();
      console.log('🔹 [PUT] Request body parsed:', requestBody);
    } catch (parseError: any) {
      console.error('❌ [PUT] JSON parsing failed:', parseError.message);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { conversationId } = requestBody;

    if (!conversationId) {
      console.error('❌ [PUT] Missing conversationId');
      return NextResponse.json(
        { success: false, error: 'conversationId required' },
        { status: 400 }
      );
    }

    console.log('🔹 [PUT] Checking rating status for conversation:', conversationId);

    // Check if user has already rated this conversation
    let existingRating;
    try {
      const raterId = parseInt(userInfo.userId);
      console.log('🔹 [PUT] Checking existing rating for rater:', raterId);
      
      existingRating = await query(
        `SELECT id FROM ratings WHERE conversation_id = $1 AND rater_id = $2`,
        [conversationId, raterId]
      );
      console.log('🔹 [PUT] Existing rating check rows:', existingRating.rows.length);
    } catch (dbError: any) {
      console.error('❌ [PUT] Database query failed - existing rating:');
      console.error('❌ [PUT] DB Error message:', dbError.message);
      console.error('❌ [PUT] DB Error stack:', dbError.stack);
      throw new Error(`Database query failed: ${dbError.message}`);
    }

    // Check conversation details
    let convResult;
    try {
      console.log('🔹 [PUT] Fetching conversation details...');
      convResult = await query(
        `SELECT buyer_id, seller_id FROM conversations WHERE id = $1`,
        [conversationId]
      );
      console.log('🔹 [PUT] Conversation query rows:', convResult.rows.length);
    } catch (dbError: any) {
      console.error('❌ [PUT] Database query failed - conversation:');
      console.error('❌ [PUT] DB Error message:', dbError.message);
      console.error('❌ [PUT] DB Error stack:', dbError.stack);
      throw new Error(`Database query failed: ${dbError.message}`);
    }

    if (convResult.rows.length === 0) {
      console.error('❌ [PUT] Conversation not found:', conversationId);
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const conversation = convResult.rows[0];
    console.log('🔹 [PUT] Conversation details:', conversation);
    
    const currentUserId = parseInt(userInfo.userId);
    console.log('🔹 [PUT] Current user ID:', currentUserId);
    
    // Determine who to rate (the other participant)
    const userToRate = currentUserId === conversation.buyer_id ? conversation.seller_id : conversation.buyer_id;
    console.log('🔹 [PUT] User to rate determined:', userToRate);

    const responseData = {
      canRate: existingRating.rows.length === 0,
      alreadyRated: existingRating.rows.length > 0,
      userToRate: userToRate,
      currentUser: currentUserId
    };

    console.log('✅ [PUT] Rating status check completed:', responseData);

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error: any) {
    console.error('❌ [PUT] CRITICAL ERROR - Rating status check failed:');
    console.error('❌ [PUT] Error name:', error.name);
    console.error('❌ [PUT] Error message:', error.message);
    console.error('❌ [PUT] Full error stack:', error.stack);
    console.error('❌ [PUT] Error occurred at:', new Date().toISOString());
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check rating status: ' + error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to update user's average rating
async function updateUserRating(userId: number) {
  try {
    console.log('🔹 [updateUserRating] Starting update for user:', userId);
    
    let avgResult;
    try {
      avgResult = await query(
        `SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count 
         FROM ratings WHERE rated_user_id = $1`,
        [userId]
      );
      console.log('🔹 [updateUserRating] Average calculation result:', avgResult.rows[0]);
    } catch (dbError: any) {
      console.error('❌ [updateUserRating] Database query failed - average calculation:');
      console.error('❌ [updateUserRating] DB Error message:', dbError.message);
      console.error('❌ [updateUserRating] DB Error stack:', dbError.stack);
      throw dbError;
    }

    const avgRating = parseFloat(avgResult.rows[0]?.avg_rating) || 0;
    const ratingCount = parseInt(avgResult.rows[0]?.rating_count) || 0;

    console.log('🔹 [updateUserRating] Calculated - avg:', avgRating, 'count:', ratingCount);

    // Update users table
    try {
      await query(
        `UPDATE users SET avg_rating = $1, total_ratings = $2 WHERE id = $3`,
        [avgRating, ratingCount, userId]
      );
      console.log(`✅ [updateUserRating] Updated user ${userId} rating: ${avgRating} (${ratingCount} ratings)`);
    } catch (dbError: any) {
      console.error('❌ [updateUserRating] Database update failed:');
      console.error('❌ [updateUserRating] DB Error message:', dbError.message);
      console.error('❌ [updateUserRating] DB Error stack:', dbError.stack);
      throw dbError;
    }

  } catch (error) {
    console.error('❌ [updateUserRating] ERROR updating user rating:');
    console.error('❌ [updateUserRating] Error:', error);
    throw error; // Re-throw to let caller handle it
  }
}