import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface PartRequestData {
  partName: string;
  partNumber?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleTrim?: string;
  oem_number?: string;
  condition: 'new' | 'used' | 'refurbished' | 'any';
  description: string;
  budget?: number;
  urgency: 'low' | 'medium' | 'high';
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  location?: string;
  preferredContactMethod: 'email' | 'phone' | 'both';
  images?: string[];
  deadline?: string;
}

// Create new part request
export async function POST(request: NextRequest) {
  try {
    const body: PartRequestData = await request.json();
    const {
      partName,
      partNumber,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleTrim,
      oem_number,
      condition,
      description,
      budget,
      urgency,
      buyerName,
      buyerEmail,
      buyerPhone,
      location,
      preferredContactMethod,
      images,
      deadline
    } = body;

    // Validate required fields
    const requiredFields = ['partName', 'vehicleMake', 'vehicleModel', 'vehicleYear', 'description', 'buyerName', 'buyerEmail'];
    for (const field of requiredFields) {
      if (!body[field as keyof PartRequestData]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
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

    // Insert into database
    const result = await query(
      `INSERT INTO part_requests (
        part_name, part_number, vehicle_make, vehicle_model, vehicle_year,
        vehicle_trim, oem_number, condition, description, budget, urgency,
        buyer_name, buyer_email, buyer_phone, location, preferred_contact_method,
        images, deadline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, part_name, vehicle_make, vehicle_model, status, created_at, expires_at`,
      [
        partName, partNumber, vehicleMake, vehicleModel, vehicleYear,
        vehicleTrim, oem_number, condition, description, budget, urgency,
        buyerName, buyerEmail, buyerPhone, location, preferredContactMethod,
        images, deadline ? new Date(deadline) : null
      ]
    );

    const newRequest = result.rows[0];

    // Notify sellers (async - don't block response)
    notifySellers(newRequest).catch(error => {
      console.error('Failed to notify sellers:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Part request submitted successfully',
      data: {
        id: newRequest.id,
        partName: newRequest.part_name,
        vehicleMake: newRequest.vehicle_make,
        vehicleModel: newRequest.vehicle_model,
        status: newRequest.status,
        created_at: newRequest.created_at,
        expires_at: newRequest.expires_at
      }
    });

  } catch (error: any) {
    console.error('Error creating part request:', error);
    
    // Handle specific database errors
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Part request already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create part request' },
      { status: 500 }
    );
  }
}

// Get part requests with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const vehicleMake = searchParams.get('make');
    const vehicleModel = searchParams.get('model');
    const urgency = searchParams.get('urgency');
    const buyerEmail = searchParams.get('buyerEmail');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCount = 0;

    // Build WHERE clause based on filters
    if (status && status !== 'all') {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
    }

    if (vehicleMake && vehicleMake !== 'all') {
      paramCount++;
      whereConditions.push(`LOWER(vehicle_make) LIKE LOWER($${paramCount})`);
      queryParams.push(`%${vehicleMake}%`);
    }

    if (vehicleModel && vehicleModel !== 'all') {
      paramCount++;
      whereConditions.push(`LOWER(vehicle_model) LIKE LOWER($${paramCount})`);
      queryParams.push(`%${vehicleModel}%`);
    }

    if (urgency && urgency !== 'all') {
      paramCount++;
      whereConditions.push(`urgency = $${paramCount}`);
      queryParams.push(urgency);
    }

    if (buyerEmail) {
      paramCount++;
      whereConditions.push(`buyer_email = $${paramCount}`);
      queryParams.push(buyerEmail);
    }

    // Only show non-expired requests by default
    if (!status || status === 'active') {
      whereConditions.push(`(expires_at IS NULL OR expires_at > NOW())`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : 'WHERE (expires_at IS NULL OR expires_at > NOW())';

    // Get requests
    const requestsResult = await query(
      `SELECT * FROM part_requests 
       ${whereClause}
       ORDER BY 
         CASE urgency 
           WHEN 'high' THEN 1 
           WHEN 'medium' THEN 2 
           WHEN 'low' THEN 3 
         END,
         created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM part_requests ${whereClause}`,
      queryParams
    );

    const totalCount = parseInt(countResult.rows[0].count);

    // Get responses count for each request
    const requestsWithStats = [];
    for (const req of requestsResult.rows) {
      const responsesResult = await query(
        `SELECT COUNT(*) FROM request_responses WHERE request_id = $1`,
        [req.id]
      );

      requestsWithStats.push({
        ...req,
        responses_count: parseInt(responsesResult.rows[0].count)
      });
    }

    // Calculate overall stats
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' AND (expires_at IS NULL OR expires_at > NOW()) THEN 1 END) as active,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'fulfilled' THEN 1 END) as fulfilled,
        COUNT(CASE WHEN status = 'expired' OR (expires_at IS NOT NULL AND expires_at <= NOW()) THEN 1 END) as expired
      FROM part_requests
    `);

    const stats = statsResult.rows[0];

    return NextResponse.json({
      success: true,
      data: requestsWithStats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats
    });

  } catch (error: any) {
    console.error('Error fetching part requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch part requests' },
      { status: 500 }
    );
  }
}

// Update part request
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, responses_count } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Part request ID is required' },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const queryParams: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      queryParams.push(status);
    }

    if (typeof responses_count === 'number') {
      paramCount++;
      updateFields.push(`responses_count = $${paramCount}`);
      queryParams.push(responses_count);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    paramCount++;
    queryParams.push(id);

    const updateResult = await query(
      `UPDATE part_requests 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      queryParams
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Part request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Part request updated successfully',
      data: updateResult.rows[0]
    });

  } catch (error: any) {
    console.error('Error updating part request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update part request' },
      { status: 500 }
    );
  }
}

// Delete part request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Part request ID is required' },
        { status: 400 }
      );
    }

    const deleteResult = await query(
      `DELETE FROM part_requests WHERE id = $1 RETURNING id`,
      [id]
    );

    if (deleteResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Part request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Part request deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting part request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete part request' },
      { status: 500 }
    );
  }
}

// Helper function to notify sellers
async function notifySellers(partRequest: any) {
  try {
    // Get relevant sellers based on part type, location, etc.
    const sellersResult = await query(
      `SELECT id, name, email FROM profiles 
       WHERE role = 'seller' 
       AND (specialties IS NULL OR specialties @> ARRAY[$1]::varchar[])
       LIMIT 10`,
      [partRequest.vehicle_make]
    );

    const sellers = sellersResult.rows;
    
    // In real app, send emails or push notifications
    console.log(`🔔 Notifying ${sellers.length} sellers about new part request: ${partRequest.part_name}`);
    
    // Log notification (in real app, this would be email/notification service)
    for (const seller of sellers) {
      console.log(`📧 Notified seller: ${seller.name} (${seller.email})`);
    }

    return { notificationsSent: sellers.length };
  } catch (error) {
    console.error('Error notifying sellers:', error);
    return { notificationsSent: 0 };
  }
}