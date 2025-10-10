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

// GET handler - makes and models fetch karne ke liye
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    console.log('🔍 GET request for action:', action);

    if (action === 'getMakes') {
      // Get all makes
      const makesResult = await query(
        'SELECT id, name FROM makes ORDER BY name'
      );
      
      console.log(`✅ Fetched ${makesResult.rows.length} makes`);
      
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

      // Validate makeId format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(makeId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid make ID format' },
          { status: 400 }
        );
      }

      // Get models for specific make
      const modelsResult = await query(
        'SELECT id, name FROM models WHERE make_id = $1 ORDER BY name',
        [makeId]
      );
      
      console.log(`✅ Fetched ${modelsResult.rows.length} models for make: ${makeId}`);
      
      return NextResponse.json({
        success: true,
        data: modelsResult.rows
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('❌ Error fetching data:', error);
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

// POST handler - part request create karne ke liye
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication token required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 Token received:', token.substring(0, 20) + '...');

    // Verify token using proper JWT verification
    let userInfo;
    try {
      userInfo = verifyToken(token);
      console.log('✅ Token verified:', { userId: userInfo.userId, email: userInfo.email });
    } catch (error: any) {
      console.error('❌ Token verification failed:', error.message);
      return NextResponse.json(
        { success: false, error: error.message || 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = userInfo.userId;

    const body: PartRequestData = await request.json();
    const {
      partName,
      partNumber,
      makeId,
      modelId,
      vehicleYear,
      description,
      budget,
      parish,
      condition,
      urgency
    } = body;

    console.log('📦 Part request data:', {
      partName,
      makeId,
      modelId,
      vehicleYear,
      parish
    });

    // Validate required fields
    const requiredFields = ['partName', 'makeId', 'modelId', 'vehicleYear', 'description'];
    for (const field of requiredFields) {
      if (!body[field as keyof PartRequestData]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate UUID format for makeId and modelId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(makeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid make ID format' },
        { status: 400 }
      );
    }

    if (!uuidRegex.test(modelId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model ID format' },
        { status: 400 }
      );
    }

    // Validate vehicle year
    const currentYear = new Date().getFullYear();
    if (vehicleYear < 1900 || vehicleYear > currentYear + 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid vehicle year' },
        { status: 400 }
      );
    }

    // Verify user exists in database
    const userCheck = await query(
      'SELECT id, email FROM profiles WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      console.log('❌ User not found in database:', userId);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User verified in database:', userCheck.rows[0].email);

    // Verify make exists
    const makeCheck = await query(
      'SELECT id, name FROM makes WHERE id = $1',
      [makeId]
    );

    if (makeCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid make ID' },
        { status: 400 }
      );
    }

    // Verify model exists and belongs to make
    const modelCheck = await query(
      'SELECT id, name FROM models WHERE id = $1 AND make_id = $2',
      [modelId, makeId]
    );

    if (modelCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid model ID or model does not belong to selected make' },
        { status: 400 }
      );
    }

    console.log('✅ Make and model verified:', {
      make: makeCheck.rows[0].name,
      model: modelCheck.rows[0].name
    });

    // Calculate expires_at (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Insert into database
    const result = await query(
      `INSERT INTO part_requests (
        user_id, make_id, model_id, year, part_name, part_number, description, 
        budget_min, parish, status, expires_at, condition, urgency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, part_name, created_at, expires_at, status`,
      [
        userId, // From JWT token verification
        makeId,
        modelId,
        vehicleYear,
        partName,
        partNumber || null,
        description,
        budget || null,
        parish,
        'open',
        expiresAt,
        condition,
        urgency
      ]
    );

    const newRequest = result.rows[0];
    console.log('✅ Part request created successfully:', newRequest.id);

    return NextResponse.json({
      success: true,
      message: 'Part request submitted successfully',
      data: {
        id: newRequest.id,
        partName: newRequest.part_name,
        status: newRequest.status,
        created_at: newRequest.created_at,
        expires_at: newRequest.expires_at
      }
    });

  } catch (error: any) {
    console.error('❌ Error creating part request:', error);
    
    // Handle specific database errors
    if (error.code === '23503') {
      return NextResponse.json(
        { success: false, error: 'Invalid make, model or user ID' },
        { status: 400 }
      );
    }
    
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Duplicate part request' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create part request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}