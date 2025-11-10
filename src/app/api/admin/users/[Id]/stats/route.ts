// app/api/admin/users/[id]/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  }
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  let userId: number;
  
  try {
    console.log('🚀 API Route Started ======================');
    
    // Correct way to get params in Next.js App Router
    const { params } = context;
    console.log('📝 Context params:', params);
    
    // Parse and validate user ID
    userId = parseInt(params.id);
    console.log(`🔢 Parsed User ID: ${userId}`);
    
    if (isNaN(userId)) {
      console.error('❌ Invalid user ID:', params.id);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid user ID',
          details: `Provided ID: ${params.id} is not a valid number`
        },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    console.log(`🎯 Role parameter: ${role}`);
    console.log(`🔗 Full URL: ${request.url}`);

    // Validate role
    if (!role) {
      console.error('❌ Missing role parameter');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Role parameter is required',
          details: 'Add ?role=buyer or ?role=seller to the URL'
        },
        { status: 400 }
      );
    }

    // For now, return mock data to test
    console.log('✅ Using mock data for testing');
    
    const mockStats = {
      total_part_requests: 15,
      open_requests: 3,
      fulfilled_requests: 12,
      total_quotes_received: 45,
      accepted_quotes: 8,
      total_spent: 1250.75
    };

    return NextResponse.json({
      success: true,
      data: mockStats,
      debug: {
        userId,
        role,
        message: 'Using mock data - API is working'
      }
    });

  } catch (error: any) {
    console.error('💥 CRITICAL ERROR in API route:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('User ID attempted:', userId);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user stats',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  } finally {
    console.log('🏁 API Route Completed ======================\n');
  }
}