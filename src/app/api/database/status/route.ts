import { NextRequest, NextResponse } from 'next/server';
import { supabase, testSupabaseConnection } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Test connection if credentials are available
    let connectionTest = null;
    if (hasSupabaseUrl && hasSupabaseKey) {
      connectionTest = await testSupabaseConnection();
    }

    return NextResponse.json({
      success: true,
      status: {
        environment: process.env.NODE_ENV || 'development',
        hasSupabaseUrl,
        hasSupabaseKey,
        mockMode: !hasSupabaseUrl || !hasSupabaseKey,
        connection: connectionTest,
        timestamp: new Date().toISOString(),
      },
      message: connectionTest?.connected
        ? '✅ Database connection successful'
        : '⚠️ Database in mock mode - configure Supabase environment variables for full functionality'
    });

  } catch (error) {
    console.error('Database status check failed:', error);

    return NextResponse.json({
      success: false,
      status: {
        environment: process.env.NODE_ENV || 'development',
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        mockMode: true,
        connection: { connected: false, error: (error as Error).message },
        timestamp: new Date().toISOString(),
      },
      message: '❌ Database connection failed',
      error: (error as Error).message
    });
  }
}
