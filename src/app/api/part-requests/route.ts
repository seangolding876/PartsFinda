import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PartRequestData {
  partName: string;
  partNumber?: string;
  makeId: string;
  modelId: string;
  vehicleYear: number;
  description: string;
  budget?: number;
  parish: string;
  condition: 'new' | 'used' | 'refurbished' | 'any';
  urgency: 'low' | 'medium' | 'high';
}

// GET - Makes, Models, aur User ke part requests fetch karne ke liye
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    console.log('🔍 GET request:', { action, userId });

    if (action === 'getMakes') {
      // Get all makes
      const makesResult = await query(
        'SELECT id, name FROM makes ORDER BY name'
      );
      
      return NextResponse.json({
        success: true,
        data: makesResult.rows
      });
    }

    if (action === 'getModels') {
      const makeId = searchParams.get('makeId');
      
      if (!makeId) {
        return NextResponse.json(
          { success: false, error: 'makeId is required' },
          { status: 400 }
        );
      }

      // Get models for specific make
      const modelsResult = await query(
        'SELECT id, name FROM models WHERE make_id = $1 ORDER BY name',
        [makeId]
      );
      
      return NextResponse.json({
        success: true,
        data: modelsResult.rows
      });
    }

    if (action === 'getUserRequests') {
      // Check authentication
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const userInfo = verifyToken(token);
      
      // Get user's part requests with make and model names
      const requestsResult = await query(
        `SELECT 
          pr.*,
          m.name as make_name,
          md.name as model_name
         FROM part_requests pr
         LEFT JOIN makes m ON pr.make_id = m.id
         LEFT JOIN models md ON pr.model_id = md.id
         WHERE pr.user_id = $1
         ORDER BY pr.created_at DESC`,
        [userInfo.userId]
      );

      return NextResponse.json({
        success: true,
        data: requestsResult.rows
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('❌ Error in GET /api/part-requests:', error);
    console.error('🔍 Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate delivery schedule based on membership
function calculateDeliverySchedule(membershipPlan: string): Date {
  const deliveryTime = new Date();
  
  switch (membershipPlan.toLowerCase()) {
    case 'free':
      deliveryTime.setHours(deliveryTime.getHours() + 48); // 48 hours
      break;
    case 'basic':
      deliveryTime.setHours(deliveryTime.getHours() + 24); // 24 hours
      break;
    case 'premium':
    case 'enterprise':
      deliveryTime.setMinutes(deliveryTime.getMinutes() + 5); // 5 minutes for immediate processing
      break;
    default:
      deliveryTime.setHours(deliveryTime.getHours() + 24); // Default 24 hours
  }
  
  return deliveryTime;
}

// Helper function to get ALL active sellers (modified to ensure we always get sellers)
async function getAllActiveSellers(userParish: string) {
  try {
    console.log('🔍 Fetching active sellers for parish:', userParish);
    
    const sellers = await query(
      `SELECT 
        u.id, u.name, u.email, u.membership_plan,
        u.specializations, u.vehicle_brands, u.part_categories, u.parish
       FROM users u
       WHERE u.role = 'seller' 
       AND u.email_verified = true
       AND u.membership_plan IN ('Basic', 'Premium', 'Enterprise')
       AND u.account_status = 'active'
       ORDER BY 
         CASE 
           WHEN u.parish = $1 THEN 1
           WHEN u.membership_plan = 'Enterprise' THEN 2
           WHEN u.membership_plan = 'Premium' THEN 3
           WHEN u.membership_plan = 'Basic' THEN 4
           ELSE 5
         END`,
      [userParish]
    );
    
    console.log(`✅ Found ${sellers.rows.length} active sellers`);
    return sellers.rows;
  } catch (error: any) {
    console.error('❌ Error fetching sellers:', error);
    console.error('🔍 Seller query error stack:', error.stack);
    // Return empty array as fallback
    return [];
  }
}

// Enhanced helper function to schedule request in queue - HAR REQUEST KE LIYE
async function scheduleRequestInQueue(partRequestId: number, sellers: any[], deliverySchedule: Date) {
  try {
    console.log(`📦 Scheduling request ${partRequestId} for ${sellers.length} sellers`);
    
    if (sellers.length === 0) {
      console.log('⚠️ No sellers found, creating a fallback queue entry');
      
      // Fallback: Create at least one queue entry with NULL seller_id
      // This ensures the background worker can still process the request
      const fallbackResult = await query(
        `INSERT INTO request_queue 
         (part_request_id, seller_id, scheduled_delivery_time, status, notes) 
         VALUES ($1, NULL, $2, 'pending', 'Fallback entry - no sellers available') 
         RETURNING id`,
        [partRequestId, deliverySchedule]
      );
      
      console.log(`✅ Created fallback queue entry: ${fallbackResult.rows[0].id}`);
      return 1;
    }
    
    // Normal case: Schedule for all found sellers
    const queuePromises = sellers.map(seller => 
      query(
        `INSERT INTO request_queue 
         (part_request_id, seller_id, scheduled_delivery_time, status) 
         VALUES ($1, $2, $3, 'pending')`,
        [partRequestId, seller.id, deliverySchedule]
      )
    );
    
    await Promise.all(queuePromises);
    console.log(`✅ Scheduled request ${partRequestId} for ${sellers.length} sellers at ${deliverySchedule}`);
    
    return sellers.length;
  } catch (error: any) {
    console.error('❌ Error scheduling request in queue:', error);
    console.error('🔍 Queue scheduling error stack:', error.stack);
    
    // Even if there's an error, try to create at least one fallback entry
    try {
      const fallbackResult = await query(
        `INSERT INTO request_queue 
         (part_request_id, seller_id, scheduled_delivery_time, status, notes) 
         VALUES ($1, NULL, $2, 'pending', 'Error recovery entry') 
         RETURNING id`,
        [partRequestId, deliverySchedule]
      );
      console.log(`✅ Created error recovery queue entry: ${fallbackResult.rows[0].id}`);
      return 1;
    } catch (fallbackError: any) {
      console.error('❌ Failed to create fallback queue entry:', fallbackError);
      console.error('🔍 Fallback error stack:', fallbackError.stack);
      throw error; // Re-throw original error
    }
  }
}

// Enhanced POST handler with guaranteed queue entry creation
export async function POST(request: NextRequest) {
  let transactionStarted = false;
  
  try {
    console.log('🚀 Starting POST /api/part-requests');
    
    // Authorization
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth token provided');
      return NextResponse.json({ success: false, error: 'Authentication token required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    let userInfo;
    try {
      userInfo = verifyToken(token);
      console.log('✅ Token verified for user:', userInfo.userId);
    } catch (error: any) {
      console.log('❌ Token verification failed:', error.message);
      return NextResponse.json({ success: false, error: error.message || 'Invalid token' }, { status: 401 });
    }
    const userId = parseInt(userInfo.userId, 10);

    // Parse request body
    let body: PartRequestData;
    try {
      body = await request.json();
      console.log('📦 Request body parsed successfully');
      console.log('📋 Body fields:', {
        partName: body.partName,
        makeId: body.makeId,
        modelId: body.modelId,
        vehicleYear: body.vehicleYear,
        parish: body.parish,
        condition: body.condition,
        urgency: body.urgency
      });
    } catch (parseError: any) {
      console.log('❌ Failed to parse request body:', parseError.message);
      return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400 });
    }

    // Required fields check
    const requiredFields = ['partName', 'makeId', 'modelId', 'vehicleYear', 'description', 'parish'];
    const missingFields = requiredFields.filter(field => !body[field as keyof PartRequestData]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return NextResponse.json({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Convert numeric fields
    const budget = body.budget !== undefined ? parseFloat(body.budget as any) : null;
    const vehicleYear = parseInt(body.vehicleYear as any, 10);
    
    if (isNaN(vehicleYear)) {
      console.log('❌ Invalid vehicle year:', body.vehicleYear);
      return NextResponse.json({ success: false, error: 'Invalid vehicle year' }, { status: 400 });
    }
    
    if (budget !== null && isNaN(budget)) {
      console.log('❌ Invalid budget value:', body.budget);
      return NextResponse.json({ success: false, error: 'Invalid budget value' }, { status: 400 });
    }

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.makeId)) {
      console.log('❌ Invalid makeId format:', body.makeId);
      return NextResponse.json({ success: false, error: 'Invalid make ID format' }, { status: 400 });
    }
    
    if (!uuidRegex.test(body.modelId)) {
      console.log('❌ Invalid modelId format:', body.modelId);
      return NextResponse.json({ success: false, error: 'Invalid model ID format' }, { status: 400 });
    }

    // Vehicle year validation
    const currentYear = new Date().getFullYear();
    if (vehicleYear < 1900 || vehicleYear > currentYear + 1) {
      console.log('❌ Vehicle year out of range:', vehicleYear);
      return NextResponse.json({ success: false, error: 'Invalid vehicle year' }, { status: 400 });
    }

    // Check user exists and get membership
    console.log('👤 Checking user existence:', userId);
    const userCheck = await query(
      'SELECT id, email, membership_plan FROM users WHERE id = $1', 
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      console.log('❌ User not found:', userId);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userMembership = userCheck.rows[0].membership_plan;
    console.log('✅ User found with membership:', userMembership);

    // Check make & model exist
    console.log('🔍 Checking make existence:', body.makeId);
    const makeCheck = await query('SELECT id, name FROM makes WHERE id = $1', [body.makeId]);
    if (makeCheck.rows.length === 0) {
      console.log('❌ Make not found:', body.makeId);
      return NextResponse.json({ success: false, error: 'Invalid make ID' }, { status: 400 });
    }
    console.log('✅ Make found:', makeCheck.rows[0].name);

    console.log('🔍 Checking model existence:', body.modelId);
    const modelCheck = await query(
      'SELECT id, name FROM models WHERE id = $1 AND make_id = $2', 
      [body.modelId, body.makeId]
    );
    if (modelCheck.rows.length === 0) {
      console.log('❌ Model not found or does not belong to make:', body.modelId);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid model ID or model does not belong to make' 
      }, { status: 400 });
    }
    console.log('✅ Model found:', modelCheck.rows[0].name);

    // Calculate delivery schedule based on membership
    const deliverySchedule = calculateDeliverySchedule(userMembership);
    console.log('📅 Delivery schedule calculated:', deliverySchedule);
    
    // Expiry 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    console.log('⏰ Request expires at:', expiresAt);

    // Start transaction for atomic operations
    console.log('🔄 Starting database transaction...');
    await query('BEGIN');
    transactionStarted = true;
    console.log('✅ Transaction started');

    try {
      // Insert part request with delivery schedule
      console.log('💾 Inserting part request into database...');
      const insertQuery = `
        INSERT INTO part_requests (
          user_id, make_id, model_id, vehicle_year, part_name, part_number, description, 
          budget, parish, status, expires_at, condition, urgency,
          delivery_schedule, membership_plan_at_request
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        RETURNING id, part_name, created_at, expires_at, status, delivery_schedule
      `;
      
      console.log('📝 Insert query prepared with params:', {
        userId, bodyMakeId: body.makeId, bodyModelId: body.modelId, vehicleYear,
        partName: body.partName, partNumber: body.partNumber, description: body.description,
        budget, parish: body.parish, condition: body.condition, urgency: body.urgency,
        deliverySchedule, userMembership
      });

      const result = await query(insertQuery, [
        userId,
        body.makeId,
        body.modelId,
        vehicleYear,
        body.partName,
        body.partNumber || null,
        body.description,
        budget,
        body.parish,
        'open',
        expiresAt,
        body.condition,
        body.urgency,
        deliverySchedule,
        userMembership
      ]);

      const newRequest = result.rows[0];
      console.log(`✅ Part request created with ID: ${newRequest.id}`);

      // Get ALL active sellers (modified to ensure we get sellers)
      console.log('🔍 Fetching active sellers...');
      const activeSellers = await getAllActiveSellers(body.parish);
      
      // HAR REQUEST KE LIYE QUEUE ENTRY CREATE KARO - guaranteed
      console.log('📦 Creating queue entries...');
      const scheduledSellersCount = await scheduleRequestInQueue(
        newRequest.id, 
        activeSellers, 
        deliverySchedule
      );

      // Commit transaction
      console.log('✅ Committing transaction...');
      await query('COMMIT');
      transactionStarted = false;
      console.log(`✅ Transaction committed for request: ${newRequest.id}`);

      // Prepare response message based on membership
      let deliveryMessage = '';
      switch (userMembership.toLowerCase()) {
        case 'free':
          deliveryMessage = 'Your request will be delivered to sellers in 48 hours';
          break;
        case 'basic':
          deliveryMessage = 'Your request will be delivered to sellers in 24 hours';
          break;
        case 'premium':
        case 'enterprise':
          deliveryMessage = 'Your request is being delivered to sellers immediately';
          break;
        default:
          deliveryMessage = 'Your request will be processed shortly';
      }

      console.log('🎉 Request completed successfully!');
      return NextResponse.json({
        success: true,
        message: 'Part request submitted successfully',
        data: {
          ...newRequest,
          scheduled_sellers_count: scheduledSellersCount,
          user_membership: userMembership,
          delivery_message: deliveryMessage,
          estimated_delivery_time: deliverySchedule,
          total_sellers_found: activeSellers.length
        }
      });

    } catch (error: any) {
      // Rollback transaction in case of error
      if (transactionStarted) {
        console.log('🔄 Rolling back transaction due to error...');
        await query('ROLLBACK');
        console.log('✅ Transaction rolled back');
      }
      console.error('❌ Error in transaction:', error);
      console.error('🔍 Transaction error stack:', error.stack);
      throw error;
    }

  } catch (error: any) {
    console.error('❌ Final error creating part request:', error);
    console.error('🔍 Final error stack:', error.stack);
    
    // Additional error details for debugging
    let errorDetails = 'Unknown error';
    if (error.message) {
      errorDetails = error.message;
    }
    if (error.code) {
      errorDetails += ` (Code: ${error.code})`;
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create part request',
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Additional endpoint to check request status
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const userId = parseInt(userInfo.userId, 10);

    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action) {
      return NextResponse.json({ success: false, error: 'Request ID and action are required' }, { status: 400 });
    }

    // Verify user owns this request
    const requestCheck = await query(
      'SELECT id FROM part_requests WHERE id = $1 AND user_id = $2',
      [requestId, userId]
    );

    if (requestCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Request not found or access denied' }, { status: 404 });
    }

    if (action === 'cancel') {
      await query(
        'UPDATE part_requests SET status = $1, updated_at = NOW() WHERE id = $2',
        ['cancelled', requestId]
      );

      // Also cancel any pending queue items
      await query(
        'UPDATE request_queue SET status = $1 WHERE part_request_id = $2 AND status = $3',
        ['cancelled', requestId, 'pending']
      );

      return NextResponse.json({
        success: true,
        message: 'Request cancelled successfully'
      });
    }

    if (action === 'upgrade') {
      // Upgrade logic for faster delivery
      const upgradeResult = await query(
        `INSERT INTO listing_upgrade 
         (part_request_id, user_id, amount, payment_status, upgraded_at) 
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id`,
        [requestId, userId, 500.00, 'paid']
      );

      // Update delivery schedule to immediate
      const immediateDelivery = new Date();
      immediateDelivery.setMinutes(immediateDelivery.getMinutes() + 5);

      await query(
        'UPDATE part_requests SET delivery_schedule = $1, upgrade_paid = $2 WHERE id = $3',
        [immediateDelivery, true, requestId]
      );

      // Update queue items to deliver immediately
      await query(
        'UPDATE request_queue SET scheduled_delivery_time = $1 WHERE part_request_id = $2 AND status = $3',
        [immediateDelivery, requestId, 'pending']
      );

      return NextResponse.json({
        success: true,
        message: 'Request upgraded for immediate delivery',
        data: {
          upgrade_id: upgradeResult.rows[0].id,
          new_delivery_time: immediateDelivery
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Error in PATCH /api/part-requests:', error);
    console.error('🔍 PATCH error stack:', error.stack);
    return NextResponse.json({
      success: false,
      error: 'Failed to update request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}