import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

// Create new part request
export async function POST(request: NextRequest) {
  try {
    const body: PartRequestData & { userId?: string } = await request.json();
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
      urgency,
      userId // Frontend se bhejenge
    } = body;

    // Validate required fields including userId
    const requiredFields = ['partName', 'makeId', 'modelId', 'vehicleYear', 'description', 'userId'];
    for (const field of requiredFields) {
      if (!body[field as keyof typeof body]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate UUID format
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

    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
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

    // Verify user exists
    const userCheck = await query(
      'SELECT id FROM profiles WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

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
        userId,
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
    console.error('Error creating part request:', error);
    
    // Handle foreign key constraint errors
    if (error.code === '23503') {
      return NextResponse.json(
        { success: false, error: 'Invalid make, model or user ID' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create part request' },
      { status: 500 }
    );
  }
}

// Get makes and models for dropdowns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

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

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}