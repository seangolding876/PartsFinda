import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  console.log('🚀 Starting rating submission API...');
  
  try {
    // 1. Authentication Check
    console.log('🔐 Checking authentication...');
    const authHeader = request.headers.get('authorization');
    console.log('📨 Auth header received:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ No Bearer token found');
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized - No token provided' 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token extracted, length:', token.length);

    // 2. Token Verification
    let userInfo;
    try {
      console.log('🔍 Verifying token...');
      userInfo = verifyToken(token);
      console.log('✅ Token verified, user ID:', userInfo.userId);
    } catch (tokenError: any) {
      console.error('❌ Token verification failed:', tokenError.message);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token' 
      }, { status: 401 });
    }

    // 3. Request Body Parsing
    console.log('📦 Parsing request body...');
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('✅ Request body parsed:', requestBody);
    } catch (parseError: any) {
      console.error('❌ JSON parse error:', parseError.message);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    const { conversationId, ratedUserId, rating, comment } = requestBody;
    console.log('📝 Rating submission details:', { 
      conversationId, 
      ratedUserId, 
      rating, 
      comment, 
      raterId: userInfo.userId 
    });

    // 4. Input Validation
    console.log('🔍 Validating inputs...');
    if (!conversationId || !ratedUserId || !rating) {
      const missingFields = [];
      if (!conversationId) missingFields.push('conversationId');
      if (!ratedUserId) missingFields.push('ratedUserId');
      if (!rating) missingFields.push('rating');
      
      console.log('❌ Missing fields:', missingFields);
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      console.log('❌ Invalid rating value:', rating);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rating must be between 1 and 5' 
        },
        { status: 400 }
      );
    }

    // 5. Type Conversion with Validation
    console.log('🔄 Converting user IDs...');
    const ratedUserIdInt = parseInt(ratedUserId);
    const raterIdInt = parseInt(userInfo.userId);

    if (isNaN(ratedUserIdInt)) {
      console.log('❌ Invalid ratedUserId:', ratedUserId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid rated user ID' 
        },
        { status: 400 }
      );
    }

    if (isNaN(raterIdInt)) {
      console.log('❌ Invalid rater ID from token:', userInfo.userId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid user ID in token' 
        },
        { status: 400 }
      );
    }

    console.log('✅ User IDs converted - Rater:', raterIdInt, 'Rated:', ratedUserIdInt);

    // 6. Conversation Validation
    console.log('💬 Checking conversation access...');
    let convCheck;
    try {
      convCheck = await query(
        `SELECT id, buyer_id, seller_id FROM conversations 
         WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
        [conversationId, raterIdInt]
      );
      console.log('✅ Conversation query executed, rows found:', convCheck.rows.length);
    } catch (dbError: any) {
      console.error('❌ Database error in conversation check:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error while checking conversation' 
        },
        { status: 500 }
      );
    }

    if (convCheck.rows.length === 0) {
      console.log('❌ Conversation not found or unauthorized:', { conversationId, raterId: raterIdInt });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Conversation not found or you are not a participant' 
        },
        { status: 404 }
      );
    }

    const conversation = convCheck.rows[0];
    console.log('✅ Conversation found:', conversation);

    // 7. Rated User Validation
    console.log('👤 Validating rated user...');
    if (ratedUserIdInt !== conversation.buyer_id && ratedUserIdInt !== conversation.seller_id) {
      console.log('❌ Rated user not in conversation:', {
        ratedUserId: ratedUserIdInt,
        buyerId: conversation.buyer_id,
        sellerId: conversation.seller_id
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'User you are trying to rate is not part of this conversation' 
        },
        { status: 400 }
      );
    }

    // 8. Self-Rating Check
    if (ratedUserIdInt === raterIdInt) {
      console.log('❌ User tried to rate themselves');
      return NextResponse.json(
        { 
          success: false, 
          error: 'You cannot rate yourself' 
        },
        { status: 400 }
      );
    }

    // 9. Duplicate Rating Check
    console.log('🔍 Checking for existing rating...');
    let existingRating;
    try {
      existingRating = await query(
        `SELECT id, rating, created_at FROM ratings WHERE conversation_id = $1 AND rater_id = $2`,
        [conversationId, raterIdInt]
      );
      console.log('✅ Existing rating check completed, found:', existingRating.rows.length);
    } catch (dbError: any) {
      console.error('❌ Database error in existing rating check:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error while checking existing ratings' 
        },
        { status: 500 }
      );
    }

    if (existingRating.rows.length > 0) {
      console.log('❌ User already rated this conversation:', existingRating.rows[0]);
      return NextResponse.json(
        { 
          success: false, 
          error: 'You have already rated this conversation' 
        },
        { status: 400 }
      );
    }

    // 10. Insert New Rating
    console.log('💾 Inserting new rating...');
    let result;
    try {
      result = await query(
        `INSERT INTO ratings (conversation_id, rater_id, rated_user_id, rating, comment)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, rating, comment, created_at`,
        [conversationId, raterIdInt, ratedUserIdInt, rating, comment || null]
      );
      console.log('✅ Rating inserted successfully:', result.rows[0]);
    } catch (dbError: any) {
      console.error('❌ Database error inserting rating:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error while saving rating' 
        },
        { status: 500 }
      );
    }

    // 11. Update User's Average Rating
    console.log('📊 Updating user average rating...');
    try {
      await updateUserRating(ratedUserIdInt);
      console.log('✅ User rating updated successfully');
    } catch (updateError: any) {
      console.error('⚠️ Error updating user rating (non-critical):', updateError);
      // Don't fail the request if this fails, just log it
    }

    // 12. Success Response
    console.log('🎉 Rating submission completed successfully');
    return NextResponse.json({
      success: true,
      data: {
        id: result.rows[0].id,
        rating: result.rows[0].rating,
        comment: result.rows[0].comment,
        createdAt: result.rows[0].created_at
      },
      message: 'Rating submitted successfully'
    }, { status: 201 });

  } catch (error: any) {
    // 13. Global Error Handling
    console.error('💥 UNEXPECTED ERROR IN RATING API:');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    
    if (error.code) {
      console.error('Database Error Code:', error.code);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error - Failed to submit rating',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function with better error handling
async function updateUserRating(userId: number) {
  try {
    console.log(`📈 Updating average rating for user ${userId}...`);
    
    const avgResult = await query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count 
       FROM ratings WHERE rated_user_id = $1`,
      [userId]
    );

    const avgRating = parseFloat(avgResult.rows[0]?.avg_rating) || 0;
    const ratingCount = parseInt(avgResult.rows[0]?.rating_count) || 0;

    // Round to 1 decimal place
    const roundedRating = Math.round(avgRating * 10) / 10;

    await query(
      `UPDATE users SET avg_rating = $1, total_ratings = $2 WHERE id = $3`,
      [roundedRating, ratingCount, userId]
    );

    console.log(`✅ User ${userId} rating updated: ${roundedRating} (${ratingCount} ratings)`);

  } catch (error: any) {
    console.error('❌ Error in updateUserRating:', error);
    throw error; // Re-throw to handle in main function
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
               'https://media.istockphoto.com/id/1257558676/vector/buyer-avatar-icon.jpg?s=170667a&w=0&k=20&c=VG92-sJeQVUZaZO9cRgBHwnUTVRTDD252tM8z-dYyzA=' as rater_avatar
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
               'https://media.istockphoto.com/id/1257558676/vector/buyer-avatar-icon.jpg?s=170667a&w=0&k=20&c=VG92-sJeQVUZaZO9cRgBHwnUTVRTDD252tM8z-dYyzA=' as rater_avatar,
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

