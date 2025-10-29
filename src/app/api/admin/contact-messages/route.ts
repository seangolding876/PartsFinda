import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    // Check if user is admin
    const userResult = await query('SELECT role FROM users WHERE id = $1', [userInfo.userId]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

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

    queryParams.push(limit, offset);

    const messagesResult = await query(messagesQuery, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total_count 
      FROM contact_messages cm
      ${whereClause}
    `;

    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].total_count);

    // Get status counts for filters
    const statusCountsQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM contact_messages
      GROUP BY status
      ORDER BY status
    `;

    const statusCountsResult = await query(statusCountsQuery);

    // Get type counts for filters
    const typeCountsQuery = `
      SELECT 
        type,
        COUNT(*) as count
      FROM contact_messages
      GROUP BY type
      ORDER BY type
    `;

    const typeCountsResult = await query(typeCountsQuery);

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
    console.error('Error fetching contact messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact messages' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    // Check if user is admin
    const userResult = await query('SELECT role FROM users WHERE id = $1', [userInfo.userId]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { messageId, status, adminNotes, assignedTo } = body;

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      updateParams.push(status);

      // If status is being set to resolved, set responded_at
      if (status === 'resolved') {
        paramCount++;
        updateFields.push(`responded_at = $${paramCount}`);
        updateParams.push(new Date());
      }
    }

    if (adminNotes !== undefined) {
      paramCount++;
      updateFields.push(`admin_notes = $${paramCount}`);
      updateParams.push(adminNotes);
    }

    if (assignedTo !== undefined) {
      paramCount++;
      updateFields.push(`assigned_to = $${paramCount}`);
      updateParams.push(assignedTo);
    }

    // Always update the updated_at timestamp
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateParams.push(new Date());

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    paramCount++;
    updateParams.push(messageId);

    const updateQuery = `
      UPDATE contact_messages 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, updateParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Message updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating contact message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    // Check if user is admin
    const userResult = await query('SELECT role FROM users WHERE id = $1', [userInfo.userId]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      'DELETE FROM contact_messages WHERE id = $1 RETURNING *',
      [messageId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting contact message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}