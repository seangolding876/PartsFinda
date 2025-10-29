import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Contact Messages API Called');
    
    // Authentication check
    const authHeader = request.headers.get('authorization');
    console.log('🔑 Auth Header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ No auth token provided');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token:', token.substring(0, 20) + '...');
    
    let userInfo;
    try {
      userInfo = verifyToken(token);
      console.log('👤 User ID:', userInfo.userId);
    } catch (tokenError) {
      console.error('❌ Token verification failed:', tokenError);
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    console.log('🔍 Checking user role...');
    let userResult;
    try {
      userResult = await query('SELECT role FROM users WHERE id = $1', [userInfo.userId]);
      console.log('👤 User query result:', userResult.rows.length ? 'Found' : 'Not found');
    } catch (dbError) {
      console.error('❌ Database error in user query:', dbError);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userRole = userResult.rows[0].role;
    console.log('🎭 User role:', userRole);

    if (userRole !== 'admin') {
      console.log('❌ Access denied - User is not admin');
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    console.log('📋 Query params:', { status, type, page, limit, search });

    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Build WHERE clause dynamically
    if (status && status !== 'all') {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
    }

    if (type && type !== 'all') {
      paramCount++;
      whereConditions.push(`type = $${paramCount}`);
      queryParams.push(type);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR subject ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    console.log('📊 Where clause:', whereClause);
    console.log('🔢 Query params:', queryParams);

    // Get messages with pagination
    const messagesQuery = `
      SELECT 
        cm.*,
        u.name as assigned_to_name
      FROM contact_messages cm
      LEFT JOIN users u ON cm.assigned_to = u.id
      ${whereClause}
      ORDER BY cm.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    const messagesParams = [...queryParams, limit, offset];
    console.log('📨 Messages query params:', messagesParams);

    let messagesResult;
    try {
      console.log('🚀 Executing messages query...');
      messagesResult = await query(messagesQuery, messagesParams);
      console.log('✅ Messages fetched:', messagesResult.rows.length);
    } catch (messagesError) {
      console.error('❌ Error in messages query:', messagesError);
      console.error('📝 Failed query:', messagesQuery);
      console.error('🔢 Failed params:', messagesParams);
      return NextResponse.json({ 
        success: false, 
        error: 'Database query failed',
        details: process.env.NODE_ENV === 'development' ? messagesError.message : undefined
      }, { status: 500 });
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total_count 
      FROM contact_messages cm
      ${whereClause}
    `;

    console.log('📊 Count query:', countQuery);
    
    let countResult;
    try {
      countResult = await query(countQuery, queryParams);
      const totalCount = parseInt(countResult.rows[0].total_count);
      console.log('🔢 Total count:', totalCount);
    } catch (countError) {
      console.error('❌ Error in count query:', countError);
      // Continue with default count
    }

    const totalCount = countResult ? parseInt(countResult.rows[0].total_count) : 0;

    // Get status counts for filters
    let statusCountsResult = { rows: [] };
    try {
      statusCountsResult = await query(`
        SELECT status, COUNT(*) as count 
        FROM contact_messages 
        GROUP BY status 
        ORDER BY status
      `);
    } catch (error) {
      console.error('❌ Error in status counts query:', error);
    }

    // Get type counts for filters
    let typeCountsResult = { rows: [] };
    try {
      typeCountsResult = await query(`
        SELECT type, COUNT(*) as count 
        FROM contact_messages 
        GROUP BY type 
        ORDER BY type
      `);
    } catch (error) {
      console.error('❌ Error in type counts query:', error);
    }

    console.log('✅ API call successful, returning data...');

    return NextResponse.json({
      success: true,
      data: {
        messages: messagesResult.rows,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        filters: {
          status: statusCountsResult.rows,
          type: typeCountsResult.rows
        }
      },
    });

  } catch (error: any) {
    console.error('🔥 Unexpected error in contact messages API:', error);
    console.error('📝 Error stack:', error.stack);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch contact messages',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack
        } : undefined,
      },
      { status: 500 }
    );
  }
}