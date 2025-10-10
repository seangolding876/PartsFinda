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
    console.error('Error in GET /api/part-requests:', error);
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

// POST handler
export async function POST(request: NextRequest) {
  try {
    // Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication token required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    let userInfo;
    try {
      userInfo = verifyToken(token);
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message || 'Invalid token' }, { status: 401 });
    }
    const userId = parseInt(userInfo.userId, 10); // JWT se ayega string, convert to integer

    const body: PartRequestData = await request.json();

    // Required fields check
    const requiredFields = ['partName', 'makeId', 'modelId', 'vehicleYear', 'description'];
    for (const field of requiredFields) {
      if (!body[field as keyof PartRequestData]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Convert numeric fields
    const budget = body.budget !== undefined ? parseFloat(body.budget as any) : null;
    const vehicleYear = parseInt(body.vehicleYear as any, 10);
    if (isNaN(vehicleYear) || (budget !== null && isNaN(budget))) {
      return NextResponse.json({ success: false, error: 'Invalid numeric values' }, { status: 400 });
    }

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.makeId) || !uuidRegex.test(body.modelId)) {
      return NextResponse.json({ success: false, error: 'Invalid UUID format' }, { status: 400 });
    }

    // Vehicle year validation
    const currentYear = new Date().getFullYear();
    if (vehicleYear < 1900 || vehicleYear > currentYear + 1) {
      return NextResponse.json({ success: false, error: 'Invalid vehicle year' }, { status: 400 });
    }

    // Check user exists
    const userCheck = await query('SELECT id, email FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    // Check make & model exist
    const makeCheck = await query('SELECT id, name FROM makes WHERE id = $1', [body.makeId]);
    if (makeCheck.rows.length === 0) return NextResponse.json({ success: false, error: 'Invalid make ID' }, { status: 400 });

    const modelCheck = await query('SELECT id, name FROM models WHERE id = $1 AND make_id = $2', [body.modelId, body.makeId]);
    if (modelCheck.rows.length === 0) return NextResponse.json({ success: false, error: 'Invalid model ID or model does not belong to make' }, { status: 400 });

    // Expiry 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

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
    return NextResponse.json({
      success: true,
      message: 'Part request submitted successfully',
      data: newRequest
    });
  } catch (error: any) {
    console.error('❌ Error creating part request:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create part request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}