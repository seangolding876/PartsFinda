import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { sendMail } from '@/lib/mailService';
import { rateLimit } from "@/lib/rateLimit";

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

// Helper function to calculate delivery schedule based on SELLER membership
function calculateSellerVisibleTime(sellerMembership: string): Date {
  const deliveryTime = new Date();
  
  // Seller ke membership ke hisaab se delivery time
  switch (sellerMembership.toLowerCase()) {
    case 'basic':
      deliveryTime.setHours(deliveryTime.getHours() + 24); // 24 hours for basic sellers
      break;
    case 'premium':
      deliveryTime.setMinutes(deliveryTime.getMinutes() + 5);
      break;
    case 'enterprise':
      deliveryTime.setMinutes(deliveryTime.getMinutes() + 5); // 5 minutes for premium/enterprise
      break;
    default:
      deliveryTime.setHours(deliveryTime.getHours() + 48); // 48 hours for free/default
  }
  
  return deliveryTime;
}

function calculateSellerDeliverySchedule(sellerMembership: string): Date {
  const deliveryTime = new Date();
  
  // Sabhi membership types ko 2 minute mein delivery
  deliveryTime.setMinutes(deliveryTime.getMinutes() + 2);
  
  return deliveryTime;
}



// Helper function to get ALL active sellers
async function getAllActiveSellers() {
  try {
    const sellers = await query(
      `SELECT 
        id, name, email, membership_plan,
        specializations, vehicle_brands, part_categories, parish
       FROM users 
       WHERE role = 'seller' 
       AND email_verified = true
      --AND status = 'active'`
    );
    
    console.log(`✅ Found ${sellers.rows.length} active sellers`);
    return sellers.rows;
  } catch (error) {
    console.error('❌ Error fetching sellers:', error);
    return [];
  }
}

// Helper function to schedule request in queue for EACH seller with their own delivery time
async function scheduleRequestForAllSellers(partRequestId: number, sellers: any[]) {
  try {
    let scheduledCount = 0;
    
    // Har seller ke liye individually schedule karen with their own delivery time
    for (const seller of sellers) {
      const sellerDeliveryTime = calculateSellerDeliverySchedule(seller.membership_plan);
      const sellerVisibleTime = calculateSellerVisibleTime(seller.membership_plan);
      await query(
        `INSERT INTO request_queue 
         (part_request_id, seller_id, scheduled_delivery_time, status, seller_visible_time) 
         VALUES ($1, $2, $3, 'pending',$4)`,
        [partRequestId, seller.id, sellerDeliveryTime, sellerVisibleTime  ]
      );
      
      scheduledCount++;
      console.log(`📅 Scheduled for seller ${seller.name} (${seller.membership_plan}) at ${sellerDeliveryTime}`);
    }
    
    console.log(`✅ Scheduled request ${partRequestId} for ${scheduledCount} sellers`);
    return scheduledCount;
  } catch (error) {
    console.error('❌ Error scheduling request in queue:', error);
    throw error;
  }
}

// Enhanced POST handler - Buyer membership check removed
export async function POST(request: NextRequest) {
  const body = await request.json();
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  try {
    // Authorization - sirf token check karen
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

    console.log('📦 Received part request data:', { userId, ...body });


    // ✅ Global Rate Limiting - ADNAN
    const allowed = await rateLimit(clientIP, 5, 60 * 60); // 5 req/hour
    
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

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

    // Start transaction
    await query('BEGIN');

    try {
      // Check user exists (sirf verify karen ke user hai)
      const userCheck = await query(
        'SELECT id, email FROM users WHERE id = $1', 
        [userId]
      );
      
      if (userCheck.rows.length === 0) {
        await query('ROLLBACK');
        return NextResponse.json({ 
          success: false, 
          error: 'User not found' 
        }, { status: 404 });
      }

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

      // Set expiry to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Insert part request - NO delivery_schedule aur NO membership_plan_at_request
      const insertQuery = `
        INSERT INTO part_requests (
          user_id, make_id, model_id, vehicle_year, part_name, part_number, description, 
          budget, parish, status, expires_at, condition, urgency
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, part_name, created_at, expires_at, status
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
        body.urgency
      ];

      console.log('💾 Inserting part request with params:', insertParams);

      const result = await query(insertQuery, insertParams);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to insert part request - no rows returned');
      }

      const newRequest = result.rows[0];
      console.log('✅ Part request inserted:', newRequest);

      // Get ALL active sellers
      const allSellers = await getAllActiveSellers();
      console.log(`🔍 Found ${allSellers.length} active sellers`);
      
      // Schedule request for ALL sellers with their individual delivery times
      let scheduledSellersCount = 0;
      if (allSellers.length > 0) {
        scheduledSellersCount = await scheduleRequestForAllSellers(newRequest.id, allSellers);
      }

      // Commit transaction
      await query('COMMIT');
      console.log('✅ Transaction committed successfully');

      return NextResponse.json({
        success: true,
        message: 'Part request submitted successfully',
        data: {
          ...newRequest,
          scheduled_sellers_count: scheduledSellersCount,
          total_sellers: allSellers.length,
          note: 'Request queued for all active sellers with individual delivery times based on their membership plans'
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

// PATCH temporarily removed as requested