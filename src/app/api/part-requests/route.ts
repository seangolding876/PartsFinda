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

// POST - New part request create karne ke liye
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication token required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);
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

    console.log('📦 Creating part request for user:', userId);

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

    // Validate vehicle year
    const currentYear = new Date().getFullYear();
    if (vehicleYear < 1900 || vehicleYear > currentYear + 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid vehicle year' },
        { status: 400 }
      );
    }

    // Calculate expires_at (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Insert into database
    const result = await query(
      `INSERT INTO part_requests (
        user_id, part_name, part_number, make_id, model_id, year, 
        description, budget, parish, condition, urgency, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        userId,
        partName,
        partNumber || null,
        makeId,
        modelId,
        vehicleYear,
        description,
        budget || null,
        parish,
        condition,
        urgency,
        expiresAt
      ]
    );

    const newRequest = result.rows[0];
    console.log('✅ Part request created successfully:', newRequest.id);

    return NextResponse.json({
      success: true,
      message: 'Part request submitted successfully',
      data: newRequest
    });

  } catch (error: any) {
    console.error('❌ Error creating part request:', error);
    
    // Handle specific database errors
    if (error.code === '23503') {
      return NextResponse.json(
        { success: false, error: 'Invalid make or model ID' },
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