import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - All models or by make_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const makeId = searchParams.get('makeId');

    if (id) {
      // Single model with make info
      const result = await query(
        `SELECT m.id, m.name, m.slug, m.created_at, 
                mk.id as make_id, mk.name as make_name
         FROM models m
         LEFT JOIN makes mk ON m.make_id = mk.id
         WHERE m.id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Model not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.rows[0]
      });
    }

    if (makeId) {
      // Models for specific make
      const result = await query(
        `SELECT m.id, m.name, m.slug, m.created_at,
                mk.id as make_id, mk.name as make_name
         FROM models m
         LEFT JOIN makes mk ON m.make_id = mk.id
         WHERE m.make_id = $1
         ORDER BY m.name`,
        [makeId]
      );
      
      return NextResponse.json({
        success: true,
        data: result.rows
      });
    }

    // All models with make info
    const result = await query(
      `SELECT m.id, m.name, m.slug, m.created_at,
              mk.id as make_id, mk.name as make_name
       FROM models m
       LEFT JOIN makes mk ON m.make_id = mk.id
       ORDER BY mk.name, m.name`
    );
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    console.error('Error in GET /api/models:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch models',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create new model
export async function POST(request: NextRequest) {
  try {
    const { name, make_id } = await request.json();

    if (!name || !make_id) {
      return NextResponse.json(
        { success: false, error: 'Name and make_id are required' },
        { status: 400 }
      );
    }

    // Check if make exists
    const makeCheck = await query('SELECT id FROM makes WHERE id = $1', [make_id]);
    if (makeCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid make ID' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await query(
      `INSERT INTO models (name, slug, make_id) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, slug, make_id, created_at`,
      [name, slug, make_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Model created successfully',
      data: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        { success: false, error: 'Model with this name already exists for this make' },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/models:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create model',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Update model
export async function PUT(request: NextRequest) {
  try {
    const { id, name, make_id } = await request.json();

    if (!id || !name || !make_id) {
      return NextResponse.json(
        { success: false, error: 'ID, name and make_id are required' },
        { status: 400 }
      );
    }

    // Check if make exists
    const makeCheck = await query('SELECT id FROM makes WHERE id = $1', [make_id]);
    if (makeCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid make ID' },
        { status: 400 }
      );
    }

    // Generate new slug if name changed
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await query(
      `UPDATE models 
       SET name = $1, slug = $2, make_id = $3 
       WHERE id = $4 
       RETURNING id, name, slug, make_id, created_at`,
      [name, slug, make_id, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Model updated successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Model with this name already exists for this make' },
        { status: 400 }
      );
    }

    console.error('Error in PUT /api/models:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update model',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete model
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
      'DELETE FROM models WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Model deleted successfully'
    });

  } catch (error: any) {
    console.error('Error in DELETE /api/models:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete model',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}