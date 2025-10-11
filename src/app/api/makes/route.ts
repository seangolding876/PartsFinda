import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - All makes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Single make
      const result = await query(
        'SELECT id, name, slug, logo_url, created_at FROM makes WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Make not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.rows[0]
      });
    }

    // All makes
    const result = await query(
      'SELECT id, name, slug, logo_url, created_at FROM makes ORDER BY name'
    );
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    console.error('Error in GET /api/makes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch makes',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create new make
export async function POST(request: NextRequest) {
  try {
    const { name, logo_url } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await query(
      `INSERT INTO makes (name, slug, logo_url) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, slug, logo_url, created_at`,
      [name, slug, logo_url || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Make created successfully',
      data: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        { success: false, error: 'Make with this name already exists' },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/makes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create make',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Update make
export async function PUT(request: NextRequest) {
  try {
    const { id, name, logo_url } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: 'ID and name are required' },
        { status: 400 }
      );
    }

    // Generate new slug if name changed
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await query(
      `UPDATE makes 
       SET name = $1, slug = $2, logo_url = $3 
       WHERE id = $4 
       RETURNING id, name, slug, logo_url, created_at`,
      [name, slug, logo_url || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Make not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Make updated successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Make with this name already exists' },
        { status: 400 }
      );
    }

    console.error('Error in PUT /api/makes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update make',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete make
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      'DELETE FROM makes WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Make not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Make deleted successfully'
    });

  } catch (error: any) {
    console.error('Error in DELETE /api/makes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete make',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}