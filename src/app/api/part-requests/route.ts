// app/api/part-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* ----------------------------- TYPES ----------------------------- */
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

interface UserInfo {
  userId: string;
  email?: string;
}

/* ----------------------------- CONFIG ----------------------------- */
const DELIVERY_SCHEDULES = {
  free: 48 * 60,       // minutes
  basic: 24 * 60,
  premium: 5,
  enterprise: 5
};

/* ----------------------------- HELPERS ----------------------------- */
function requireAuth(request: NextRequest): UserInfo {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('Authentication required');
  const token = authHeader.replace('Bearer ', '');
  return verifyToken(token);
}

function parseNumber(value: any, fieldName: string): number {
  const num = Number(value);
  if (isNaN(num)) throw new Error(`Invalid ${fieldName}`);
  return num;
}

function validateUUID(id: string, fieldName: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) throw new Error(`Invalid ${fieldName}`);
}

function calculateDeliverySchedule(membershipPlan: string): Date {
  const minutes = DELIVERY_SCHEDULES[membershipPlan.toLowerCase()] ?? 24 * 60;
  const deliveryTime = new Date();
  deliveryTime.setMinutes(deliveryTime.getMinutes() + minutes);
  return deliveryTime;
}

async function getAllActiveSellers(userParish: string) {
  try {
    const sellers = await query(
      `SELECT id, name, email, membership_plan, specializations, vehicle_brands, part_categories, parish
       FROM users
       WHERE role = 'seller'
         AND email_verified = true
         AND membership_plan IN ('Basic','Premium','Enterprise')
         AND account_status = 'active'
       ORDER BY 
         CASE
           WHEN parish = $1 THEN 1
           WHEN membership_plan = 'Enterprise' THEN 2
           WHEN membership_plan = 'Premium' THEN 3
           WHEN membership_plan = 'Basic' THEN 4
           ELSE 5
         END`,
      [userParish]
    );
    return sellers.rows;
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return [];
  }
}

async function scheduleRequestInQueue(partRequestId: number, sellers: any[], deliverySchedule: Date) {
  try {
    if (sellers.length === 0) {
      const fallback = await query(
        `INSERT INTO request_queue (part_request_id, seller_id, scheduled_delivery_time, status, notes)
         VALUES ($1, NULL, $2, 'pending', 'Fallback entry - no sellers available') RETURNING id`,
        [partRequestId, deliverySchedule]
      );
      return 1;
    }

    const promises = sellers.map(seller =>
      query(
        `INSERT INTO request_queue (part_request_id, seller_id, scheduled_delivery_time, status)
         VALUES ($1, $2, $3, 'pending')`,
        [partRequestId, seller.id, deliverySchedule]
      )
    );
    await Promise.all(promises);
    return sellers.length;
  } catch (error) {
    console.error('Error scheduling request queue:', error);
    const fallback = await query(
      `INSERT INTO request_queue (part_request_id, seller_id, scheduled_delivery_time, status, notes)
       VALUES ($1, NULL, $2, 'pending', 'Error recovery entry') RETURNING id`,
      [partRequestId, deliverySchedule]
    );
    return 1;
  }
}

/* ----------------------------- GET ----------------------------- */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userIdParam = searchParams.get('userId');

    if (action === 'getMakes') {
      const makes = await query('SELECT id, name FROM makes ORDER BY name');
      return NextResponse.json({ success: true, data: makes.rows });
    }

    if (action === 'getModels') {
      const makeId = searchParams.get('makeId');
      if (!makeId) return NextResponse.json({ success: false, error: 'makeId is required' }, { status: 400 });
      const models = await query('SELECT id, name FROM models WHERE make_id = $1 ORDER BY name', [makeId]);
      return NextResponse.json({ success: true, data: models.rows });
    }

    if (action === 'getUserRequests') {
      const userInfo = requireAuth(request);
      const requests = await query(
        `SELECT pr.*, m.name as make_name, md.name as model_name
         FROM part_requests pr
         LEFT JOIN makes m ON pr.make_id = m.id
         LEFT JOIN models md ON pr.model_id = md.id
         WHERE pr.user_id = $1
         ORDER BY pr.created_at DESC`,
        [userInfo.userId]
      );
      return NextResponse.json({ success: true, data: requests.rows });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch data', details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 });
  }
}

/* ----------------------------- POST ----------------------------- */
export async function POST(request: NextRequest) {
  let transactionStarted = false;
  try {
    const userInfo = requireAuth(request);
    const body: PartRequestData = await request.json();

    // Validation
    const requiredFields = ['partName', 'makeId', 'modelId', 'vehicleYear', 'description', 'parish'];
    const missing = requiredFields.filter(f => !body[f as keyof PartRequestData]);
    if (missing.length) return NextResponse.json({ success: false, error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });

    validateUUID(body.makeId, 'makeId');
    validateUUID(body.modelId, 'modelId');

    const vehicleYear = parseNumber(body.vehicleYear, 'vehicleYear');
    if (vehicleYear < 1900 || vehicleYear > new Date().getFullYear() + 1) return NextResponse.json({ success: false, error: 'Invalid vehicle year' }, { status: 400 });

    const budget = body.budget !== undefined ? parseNumber(body.budget, 'budget') : null;

    // Verify user
    const userCheck = await query('SELECT id, membership_plan FROM users WHERE id = $1', [userInfo.userId]);
    if (userCheck.rows.length === 0) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    const membershipPlan = userCheck.rows[0].membership_plan;

    // Verify make & model
    const makeCheck = await query('SELECT id FROM makes WHERE id = $1', [body.makeId]);
    if (!makeCheck.rows.length) return NextResponse.json({ success: false, error: 'Invalid make ID' }, { status: 400 });

    const modelCheck = await query('SELECT id FROM models WHERE id = $1 AND make_id = $2', [body.modelId, body.makeId]);
    if (!modelCheck.rows.length) return NextResponse.json({ success: false, error: 'Invalid model ID or does not belong to make' }, { status: 400 });

    // Delivery & expiry
    const deliverySchedule = calculateDeliverySchedule(membershipPlan);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Transaction
    await query('BEGIN');
    transactionStarted = true;

    const insertResult = await query(
      `INSERT INTO part_requests 
       (user_id, make_id, model_id, vehicle_year, part_name, part_number, description, budget, parish, status, expires_at, condition, urgency, delivery_schedule, membership_plan_at_request)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'open',$10,$11,$12,$13,$14)
       RETURNING id, part_name, created_at, expires_at, status, delivery_schedule`,
      [userInfo.userId, body.makeId, body.modelId, vehicleYear, body.partName, body.partNumber || null, body.description, budget, body.parish, expiresAt, body.condition, body.urgency, deliverySchedule, membershipPlan]
    );

    const newRequest = insertResult.rows[0];

    const activeSellers = await getAllActiveSellers(body.parish);
    const scheduledCount = await scheduleRequestInQueue(newRequest.id, activeSellers, deliverySchedule);

    await query('COMMIT');
    transactionStarted = false;

    let deliveryMessage = '';
    switch (membershipPlan.toLowerCase()) {
      case 'free': deliveryMessage = 'Delivered in 48 hours'; break;
      case 'basic': deliveryMessage = 'Delivered in 24 hours'; break;
      case 'premium':
      case 'enterprise': deliveryMessage = 'Delivered immediately'; break;
      default: deliveryMessage = 'Processing shortly';
    }

    return NextResponse.json({
      success: true,
      message: 'Part request submitted successfully',
      data: {
        ...newRequest,
        scheduled_sellers_count: scheduledCount,
        user_membership: membershipPlan,
        delivery_message: deliveryMessage,
        estimated_delivery_time: deliverySchedule,
        total_sellers_found: activeSellers.length
      }
    });

  } catch (error: any) {
    if (transactionStarted) await query('ROLLBACK');
    console.error('POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create request', details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 });
  }
}

/* ----------------------------- PATCH ----------------------------- */
export async function PATCH(request: NextRequest) {
  try {
    const userInfo = requireAuth(request);
    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action) return NextResponse.json({ success: false, error: 'requestId and action required' }, { status: 400 });

    const requestCheck = await query('SELECT id FROM part_requests WHERE id = $1 AND user_id = $2', [requestId, userInfo.userId]);
    if (!requestCheck.rows.length) return NextResponse.json({ success: false, error: 'Request not found or access denied' }, { status: 404 });

    if (action === 'cancel') {
      await query('UPDATE part_requests SET status=$1, updated_at=NOW() WHERE id=$2', ['cancelled', requestId]);
      await query('UPDATE request_queue SET status=$1 WHERE part_request_id=$2 AND status=$3', ['cancelled', requestId, 'pending']);
      return NextResponse.json({ success: true, message: 'Request cancelled successfully' });
    }

    if (action === 'upgrade') {
      const upgradeResult = await query(
        `INSERT INTO listing_upgrade (part_request_id, user_id, amount, payment_status, upgraded_at)
         VALUES ($1,$2,$3,'paid',NOW()) RETURNING id`,
        [requestId, userInfo.userId, 500]
      );
      const immediate = new Date();
      immediate.setMinutes(immediate.getMinutes() + 5);

      await query('UPDATE part_requests SET delivery_schedule=$1, upgrade_paid=$2 WHERE id=$3', [immediate, true, requestId]);
      await query('UPDATE request_queue SET scheduled_delivery_time=$1 WHERE part_request_id=$2 AND status=$3', [immediate, requestId, 'pending']);

      return NextResponse.json({ success: true, message: 'Request upgraded', data: { upgrade_id: upgradeResult.rows[0].id, new_delivery_time: immediate } });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update request', details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 });
  }
}
