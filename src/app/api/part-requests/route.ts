import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

interface PartRequest extends PartRequestData {
  id: string;
  status: 'active' | 'in_progress' | 'fulfilled' | 'expired';
  created_at: string;
  updated_at: string;
  responses_count: number;
  expires_at: string;
}

// Mock database for part requests
let partRequests: PartRequest[] = [
  {
    id: '1',
    partName: 'Front Brake Pads',
    partNumber: 'BP-123456',
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    vehicleYear: 2020,
    vehicleTrim: 'LE',
    condition: 'new',
    description: 'Need OEM or equivalent quality front brake pads for my 2020 Toyota Camry LE. Must be ceramic compound.',
    budget: 150,
    urgency: 'medium',
    buyerName: 'John Doe',
    buyerEmail: 'john.doe@email.com',
    buyerPhone: '+1-555-0123',
    location: 'Los Angeles, CA',
    preferredContactMethod: 'email',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    responses_count: 3,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days from now
  },
  {
    id: '2',
    partName: 'Headlight Assembly',
    vehicleMake: 'Honda',
    vehicleModel: 'Civic',
    vehicleYear: 2019,
    condition: 'used',
    description: 'Looking for a driver side headlight assembly. Small crack in current one, needs replacement.',
    budget: 200,
    urgency: 'high',
    buyerName: 'Jane Smith',
    buyerEmail: 'jane.smith@email.com',
    location: 'Houston, TX',
    preferredContactMethod: 'phone',
    status: 'active',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    responses_count: 1,
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

async function notifySellers(partRequest: PartRequest) {
  try {
    // Send notifications to relevant sellers
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'part-request',
        data: partRequest
      }),
    });

    if (!response.ok) {
      console.error('Failed to send seller notifications');
      return false;
    }

    const result = await response.json();
    console.log(`✅ Notified ${result.notificationsSent} sellers about part request ${partRequest.id}`);
    return true;
  } catch (error) {
    console.error('Error sending seller notifications:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const partRequestData: PartRequestData = body;

    // Validate required fields
    const requiredFields = ['partName', 'vehicleMake', 'vehicleModel', 'vehicleYear', 'description', 'buyerName', 'buyerEmail'];
    for (const field of requiredFields) {
      if (!partRequestData[field as keyof PartRequestData]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(partRequestData.buyerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate vehicle year
    const currentYear = new Date().getFullYear();
    if (partRequestData.vehicleYear < 1900 || partRequestData.vehicleYear > currentYear + 1) {
      return NextResponse.json(
        { error: 'Invalid vehicle year' },
        { status: 400 }
      );
    }

    // Create new part request
    const newPartRequest: PartRequest = {
      id: generateId(),
      ...partRequestData,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      responses_count: 0,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    };

    try {
      // Try to save to Supabase
      const { data, error } = await supabase
        .from('part_requests')
        .insert([newPartRequest])
        .select()
        .single();

      if (error) {
        console.log('Supabase error, using mock database:', error.message);
        // Fall back to mock database
        partRequests.push(newPartRequest);
      } else {
        console.log('Part request saved to database');
      }
    } catch (dbError) {
      console.log('Database unavailable, using mock storage');
      // Fall back to mock database
      partRequests.push(newPartRequest);
    }

    // Send notifications to sellers (async, don't block response)
    notifySellers(newPartRequest).catch(error => {
      console.error('Failed to notify sellers:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Part request submitted successfully',
      data: {
        id: newPartRequest.id,
        status: newPartRequest.status,
        created_at: newPartRequest.created_at,
        expires_at: newPartRequest.expires_at
      }
    });

  } catch (error) {
    console.error('Error creating part request:', error);
    return NextResponse.json(
      { error: 'Failed to create part request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const vehicleMake = searchParams.get('make');
    const vehicleModel = searchParams.get('model');
    const urgency = searchParams.get('urgency');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let filteredRequests = [...partRequests];

    // Apply filters
    if (status && status !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.status === status);
    }

    if (vehicleMake && vehicleMake !== 'all') {
      filteredRequests = filteredRequests.filter(req =>
        req.vehicleMake.toLowerCase().includes(vehicleMake.toLowerCase())
      );
    }

    if (vehicleModel && vehicleModel !== 'all') {
      filteredRequests = filteredRequests.filter(req =>
        req.vehicleModel.toLowerCase().includes(vehicleModel.toLowerCase())
      );
    }

    if (urgency && urgency !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.urgency === urgency);
    }

    // Sort by creation date (newest first)
    filteredRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination
    const paginatedRequests = filteredRequests.slice(offset, offset + limit);

    // Calculate stats
    const stats = {
      total: filteredRequests.length,
      active: filteredRequests.filter(req => req.status === 'active').length,
      in_progress: filteredRequests.filter(req => req.status === 'in_progress').length,
      fulfilled: filteredRequests.filter(req => req.status === 'fulfilled').length,
      expired: filteredRequests.filter(req => req.status === 'expired').length,
    };

    return NextResponse.json({
      success: true,
      data: paginatedRequests,
      pagination: {
        total: filteredRequests.length,
        limit,
        offset,
        hasMore: offset + limit < filteredRequests.length
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching part requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch part requests' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, responses_count } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Part request ID is required' },
        { status: 400 }
      );
    }

    const requestIndex = partRequests.findIndex(req => req.id === id);
    if (requestIndex === -1) {
      return NextResponse.json(
        { error: 'Part request not found' },
        { status: 404 }
      );
    }

    // Update part request
    const updatedRequest = { ...partRequests[requestIndex] };

    if (status) {
      updatedRequest.status = status;
    }

    if (typeof responses_count === 'number') {
      updatedRequest.responses_count = responses_count;
    }

    updatedRequest.updated_at = new Date().toISOString();

    partRequests[requestIndex] = updatedRequest;

    try {
      // Try to update in Supabase
      const { error } = await supabase
        .from('part_requests')
        .update({
          status: updatedRequest.status,
          responses_count: updatedRequest.responses_count,
          updated_at: updatedRequest.updated_at
        })
        .eq('id', id);

      if (error) {
        console.log('Supabase update error:', error.message);
      }
    } catch (dbError) {
      console.log('Database update failed, using mock storage');
    }

    return NextResponse.json({
      success: true,
      message: 'Part request updated successfully',
      data: updatedRequest
    });

  } catch (error) {
    console.error('Error updating part request:', error);
    return NextResponse.json(
      { error: 'Failed to update part request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Part request ID is required' },
        { status: 400 }
      );
    }

    const requestIndex = partRequests.findIndex(req => req.id === id);
    if (requestIndex === -1) {
      return NextResponse.json(
        { error: 'Part request not found' },
        { status: 404 }
      );
    }

    // Remove from mock database
    partRequests.splice(requestIndex, 1);

    try {
      // Try to delete from Supabase
      const { error } = await supabase
        .from('part_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.log('Supabase delete error:', error.message);
      }
    } catch (dbError) {
      console.log('Database delete failed, using mock storage');
    }

    return NextResponse.json({
      success: true,
      message: 'Part request deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting part request:', error);
    return NextResponse.json(
      { error: 'Failed to delete part request' },
      { status: 500 }
    );
  }
}
