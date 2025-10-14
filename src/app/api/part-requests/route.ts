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
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const userInfo = verifyToken(token);
      
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
    console.error('❌ Error in GET /api/part-requests:', error.message, error.stack);
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
      deliveryTime.setHours(deliveryTime.getHours() + 48);
      break;
    case 'basic':
      deliveryTime.setHours(deliveryTime.getHours() + 24);
      break;
    case 'premium':
    case 'enterprise':
      deliveryTime.setMinutes(deliveryTime.getMinutes() + 5);
      break;
    default:
      deliveryTime.setHours(deliveryTime.getHours() + 24);
  }
  
  return deliveryTime;
}

// Helper function to get relevant sellers for a part request
async function getRelevantSellers(partRequestData: PartRequestData, userParish: string) {
  try {
    const sellers = await query(
      `SELECT 
        u.id, u.name, u.email, u.membership_plan,
        u.specializations, u.vehicle_brands, u.part_categories, u.parish
       FROM users u
       WHERE u.role = 'seller' 
       AND u.email_verified = true
       AND u.membership_plan IN ('Basic', 'Premium', 'Enterprise')
       --AND (u.parish = $1 OR u.parish IS NULL OR u.parish = '')
      `,
      [userParish]
    );
    
    return sellers.rows;
  } catch (error) {
    console.error('❌ Error fetching relevant sellers:', error);
    return [];
  }
}

// Helper function to schedule request in queue
async function scheduleRequestInQueue(partRequestId: number, sellers: any[], deliverySchedule: Date) {
  try {
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
  } catch (error) {
    console.error('❌ Error scheduling request in queue:', error);
    throw error;
  }
}

// Enhanced POST handler with comprehensive error handling
// Enhanced POST handler with comprehensive error handling
export async function POST(request: NextRequest) {
  try {
    // Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication token required' 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    let userInfo;
    try {
      userInfo = verifyToken(token);
    } catch (error: any) {
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Invalid token' 
      }, { status: 401 });
    }

    const userId = parseInt(userInfo.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid user ID' 
      }, { status: 400 });
    }

    // Parse request body
    let body: PartRequestData;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    console.log('📦 Received part request data:', { userId, ...body });

    // Required fields validation
    const requiredFields = ['partName', 'makeId', 'modelId', 'vehicleYear', 'description', 'parish', 'condition', 'urgency'];
    const missingFields = requiredFields.filter(field => !body[field as keyof PartRequestData]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Convert numeric fields with validation
    const budget = body.budget !== undefined ? parseFloat(body.budget as any) : null;
    const vehicleYear = parseInt(body.vehicleYear as any, 10);
    
    if (isNaN(vehicleYear)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid vehicle year' 
      }, { status: 400 });
    }

    if (budget !== null && (isNaN(budget) || budget < 0)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid budget amount' 
      }, { status: 400 });
    }

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.makeId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid make ID format' 
      }, { status: 400 });
    }

    if (!uuidRegex.test(body.modelId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid model ID format' 
      }, { status: 400 });
    }

    // Vehicle year validation
    const currentYear = new Date().getFullYear();
    if (vehicleYear < 1900 || vehicleYear > currentYear + 1) {
      return NextResponse.json({ 
        success: false, 
        error: `Vehicle year must be between 1900 and ${currentYear + 1}` 
      }, { status: 400 });
    }

    // Condition and urgency validation
    const validConditions = ['new', 'used', 'refurbished', 'any'];
    if (!validConditions.includes(body.condition)) {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid condition. Must be one of: ${validConditions.join(', ')}` 
      }, { status: 400 });
    }

    const validUrgencies = ['low', 'medium', 'high'];
    if (!validUrgencies.includes(body.urgency)) {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid urgency. Must be one of: ${validUrgencies.join(', ')}` 
      }, { status: 400 });
    }

    // Start transaction using the existing query function
    await query('BEGIN');

    try {
      // Check user exists and get membership
      const userCheck = await query(
        'SELECT id, email, membership_plan FROM users WHERE id = $1', 
        [userId]
      );
      
      if (userCheck.rows.length === 0) {
        await query('ROLLBACK');
        return NextResponse.json({ 
          success: false, 
          error: 'User not found' 
        }, { status: 404 });
      }

      const userMembership = userCheck.rows[0].membership_plan || 'free';

      // Check make exists
      const makeCheck = await query(
        'SELECT id, name FROM makes WHERE id = $1', 
        [body.makeId]
      );
      
      if (makeCheck.rows.length === 0) {
        await query('ROLLBACK');
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid make ID' 
        }, { status: 400 });
      }

      // Check model exists and belongs to make
      const modelCheck = await query(
        'SELECT id, name FROM models WHERE id = $1 AND make_id = $2', 
        [body.modelId, body.makeId]
      );
      
      if (modelCheck.rows.length === 0) {
        await query('ROLLBACK');
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid model ID or model does not belong to make' 
        }, { status: 400 });
      }

      // Calculate delivery schedule based on membership
      const deliverySchedule = calculateDeliverySchedule(userMembership);
      
      // Set expiry to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      console.log('🗓️ Calculated schedules:', { deliverySchedule, expiresAt });

      // Insert part request
      const insertQuery = `
        INSERT INTO part_requests (
          user_id, make_id, model_id, vehicle_year, part_name, part_number, description, 
          budget, parish, status, expires_at, condition, urgency,
          delivery_schedule, membership_plan_at_request
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, part_name, created_at, expires_at, status, delivery_schedule
      `;

      const insertParams = [
        userId,
        body.makeId,
        body.modelId,
        vehicleYear,
        body.partName.trim(),
        body.partNumber ? body.partNumber.trim() : null,
        body.description.trim(),
        budget,
        body.parish,
        'open',
        expiresAt,
        body.condition,
        body.urgency,
        deliverySchedule,
        userMembership
      ];

      console.log('💾 Inserting part request with params:', insertParams);

      const result = await query(insertQuery, insertParams);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to insert part request - no rows returned');
      }

      const newRequest = result.rows[0];
      console.log('✅ Part request inserted:', newRequest);

      // Get relevant sellers for this request
      const relevantSellers = await getRelevantSellers(body, body.parish);
      console.log(`🔍 Found ${relevantSellers.length} relevant sellers`);
      
      // Schedule request for sellers
      let scheduledSellersCount = 0;
      if (relevantSellers.length > 0) {
        scheduledSellersCount = await scheduleRequestInQueue(
          newRequest.id, 
          relevantSellers, 
          deliverySchedule
        );
      }

      // Commit transaction
      await query('COMMIT');
      console.log('✅ Transaction committed successfully');

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

      return NextResponse.json({
        success: true,
        message: 'Part request submitted successfully',
        data: {
          ...newRequest,
          scheduled_sellers_count: scheduledSellersCount,
          user_membership: userMembership,
          delivery_message: deliveryMessage,
          estimated_delivery_time: deliverySchedule
        }
      });

    } catch (error) {
      // Rollback transaction in case of error
      await query('ROLLBACK');
      console.error('❌ Transaction rolled back due to error:', error);
      throw error;
    }

  } catch (error: any) {
    console.error('❌ Error creating part request:', error.message, error.stack);
    
    // More specific error messages
    let errorMessage = 'Failed to create part request';
    if (error.message.includes('violates foreign key constraint')) {
      errorMessage = 'Invalid user, make, or model ID';
    } else if (error.message.includes('duplicate key')) {
      errorMessage = 'Duplicate request detected';
    } else if (error.message.includes('null value')) {
      errorMessage = 'Required fields are missing';
    } else if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Database connection failed';
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        code: error.code
      } : undefined
    }, { status: 500 });
  }
}
// Enhanced PATCH handler
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
    const userId = parseInt(userInfo.userId, 10);

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    const { requestId, action } = body;

    if (!requestId || !action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request ID and action are required' 
      }, { status: 400 });
    }

    // Verify user owns this request
    const requestCheck = await query(
      'SELECT id, status FROM part_requests WHERE id = $1 AND user_id = $2',
      [requestId, userId]
    );

    if (requestCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request not found or access denied' 
      }, { status: 404 });
    }

    const currentStatus = requestCheck.rows[0].status;
    
    if (action === 'cancel') {
      if (currentStatus === 'cancelled') {
        return NextResponse.json({ 
          success: false, 
          error: 'Request is already cancelled' 
        }, { status: 400 });
      }

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

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Error in PATCH /api/part-requests:', error.message, error.stack);
    return NextResponse.json({
      success: false,
      error: 'Failed to update request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}