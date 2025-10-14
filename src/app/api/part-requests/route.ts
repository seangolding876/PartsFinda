import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

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

// Helper function - Seller ke membership ke hisaab se delivery time calculate karein
function calculateSellerDeliveryTime(sellerMembership: string): Date {
  const deliveryTime = new Date();
  
  if (sellerMembership.toLowerCase() === 'basic') {
    // Basic seller: 24 hours baad
    deliveryTime.setHours(deliveryTime.getHours() + 24);
    console.log(`   ⏰ Basic seller - Scheduled for: ${deliveryTime.toISOString()}`);
  } else {
    // Premium, Enterprise, etc.: Immediately (2 minutes mein)
    deliveryTime.setMinutes(deliveryTime.getMinutes() + 2);
    console.log(`   ⚡ Premium seller - Scheduled for: ${deliveryTime.toISOString()}`);
  }
  
  return deliveryTime;
}

// Helper function - Relevant sellers find karein
async function getRelevantSellers(partRequestData: PartRequestData) {
  try {
    console.log(`🔍 Finding relevant sellers for parish: ${partRequestData.parish}`);
    
    const sellers = await query(
      `SELECT 
        id, name, email, membership_plan,
        specializations, vehicle_brands, part_categories, parish
       FROM users 
       WHERE role = 'seller' 
       AND email_verified = true
       AND membership_plan IN ('basic', 'premium', 'enterprise')
       AND status = 'active'
       ORDER BY 
         CASE 
           WHEN parish = $1 THEN 1
           WHEN membership_plan = 'enterprise' THEN 2
           WHEN membership_plan = 'premium' THEN 3
           ELSE 4
         END`,
      [partRequestData.parish]
    );
    
    console.log(`✅ Found ${sellers.rows.length} relevant sellers`);
    return sellers.rows;
  } catch (error) {
    console.error('❌ Error fetching relevant sellers:', error);
    return [];
  }
}

// Helper function - Request queue mein schedule karein
async function scheduleRequestToSellers(partRequestId: number, sellers: any[]) {
  try {
    let basicSellersCount = 0;
    let premiumSellersCount = 0;
    
    console.log(`📦 Scheduling request ${partRequestId} for ${sellers.length} sellers...`);
    
    for (const seller of sellers) {
      // Har seller ke liye alag delivery time calculate karein
      const deliveryTime = calculateSellerDeliveryTime(seller.membership_plan);
      
      await query(
        `INSERT INTO request_queue 
         (part_request_id, seller_id, scheduled_delivery_time, status) 
         VALUES ($1, $2, $3, 'pending')`,
        [partRequestId, seller.id, deliveryTime]
      );
      
      // Count track karein
      if (seller.membership_plan === 'basic') {
        basicSellersCount++;
      } else {
        premiumSellersCount++;
      }
    }
    
    console.log(`🎯 Request ${partRequestId} scheduled successfully:`);
    console.log(`   👑 Premium/Enterprise: ${premiumSellersCount} sellers (immediate delivery)`);
    console.log(`   🔹 Basic: ${basicSellersCount} sellers (24 hours delivery)`);
    
    return { basicSellersCount, premiumSellersCount };
    
  } catch (error) {
    console.error('❌ Error scheduling request to sellers:', error);
    throw error;
  }
}

// POST handler - Production ready
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('\n🚀 ===== NEW PART REQUEST RECEIVED =====');
  
  try {
    // Authorization check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Authentication failed: No token provided');
      return NextResponse.json({ success: false, error: 'Authentication token required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    let userInfo;
    try {
      userInfo = verifyToken(token);
    } catch (error: any) {
      console.log('❌ Authentication failed: Invalid token');
      return NextResponse.json({ success: false, error: error.message || 'Invalid token' }, { status: 401 });
    }
    const userId = parseInt(userInfo.userId, 10);

    const body: PartRequestData = await request.json();
    console.log(`📝 Request from user ${userId}: ${body.partName}`);

    // Required fields check
    const requiredFields = ['partName', 'makeId', 'modelId', 'vehicleYear', 'description'];
    for (const field of requiredFields) {
      if (!body[field as keyof PartRequestData]) {
        console.log(`❌ Validation failed: Missing ${field}`);
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Convert numeric fields
    const budget = body.budget !== undefined ? parseFloat(body.budget as any) : null;
    const vehicleYear = parseInt(body.vehicleYear as any, 10);
    if (isNaN(vehicleYear) || (budget !== null && isNaN(budget))) {
      console.log('❌ Validation failed: Invalid numeric values');
      return NextResponse.json({ success: false, error: 'Invalid numeric values' }, { status: 400 });
    }

    // Check user exists
    const userCheck = await query('SELECT id, email, name FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      console.log(`❌ User not found: ${userId}`);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const buyer = userCheck.rows[0];
    console.log(`👤 Buyer: ${buyer.name} (${buyer.email})`);

    // Check make & model exist
    const makeCheck = await query('SELECT id, name FROM makes WHERE id = $1', [body.makeId]);
    if (makeCheck.rows.length === 0) {
      console.log(`❌ Invalid make ID: ${body.makeId}`);
      return NextResponse.json({ success: false, error: 'Invalid make ID' }, { status: 400 });
    }

    const modelCheck = await query(
      'SELECT id, name FROM models WHERE id = $1 AND make_id = $2', 
      [body.modelId, body.makeId]
    );
    if (modelCheck.rows.length === 0) {
      console.log(`❌ Invalid model ID: ${body.modelId} for make: ${body.makeId}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid model ID or model does not belong to make' 
      }, { status: 400 });
    }

    // Expiry 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Start transaction
    console.log('💾 Starting database transaction...');
    await query('BEGIN');

    try {
      // Insert part request
      const result = await query(
        `INSERT INTO part_requests (
          user_id, make_id, model_id, vehicle_year, part_name, part_number, description, 
          budget, parish, status, expires_at, condition, urgency
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING id, part_name, created_at, expires_at, status`,
        [
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
          body.urgency
        ]
      );

      const newRequest = result.rows[0];
      console.log(`✅ Part request created: ID ${newRequest.id}`);

      // Get relevant sellers
      const relevantSellers = await getRelevantSellers(body);
      
      // Schedule request for sellers with their respective delivery times
      let scheduledCounts = { basicSellersCount: 0, premiumSellersCount: 0 };
      if (relevantSellers.length > 0) {
        scheduledCounts = await scheduleRequestToSellers(newRequest.id, relevantSellers);
      } else {
        console.log('⚠️  No relevant sellers found for this request');
      }

      // Commit transaction
      await query('COMMIT');
      console.log('✅ Database transaction committed');

      const endTime = Date.now();
      console.log(`🎉 Request processing completed in ${endTime - startTime}ms`);
      console.log('===== REQUEST PROCESSING FINISHED =====\n');

      return NextResponse.json({
        success: true,
        message: 'Part request submitted successfully',
        data: {
          ...newRequest,
          sellers_scheduled: {
            total: relevantSellers.length,
            basic: scheduledCounts.basicSellersCount,
            premium: scheduledCounts.premiumSellersCount
          },
          delivery_info: {
            basic_sellers: 'Delivered after 24 hours',
            premium_sellers: 'Delivered immediately (within 2 minutes)'
          },
          processing_time: `${endTime - startTime}ms`
        }
      });

    } catch (error) {
      // Rollback transaction in case of error
      await query('ROLLBACK');
      console.error('❌ Transaction rolled back due to error');
      throw error;
    }

  } catch (error: any) {
    const endTime = Date.now();
    console.error(`💥 Request failed after ${endTime - startTime}ms:`, error);
    console.log('===== REQUEST FAILED =====\n');
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create part request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Force dynamic rendering for production
export const dynamic = 'force-dynamic';