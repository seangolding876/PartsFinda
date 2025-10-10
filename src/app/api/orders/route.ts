import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  seller_id: string;
  seller_name: string;
  image_url?: string;
  part_number?: string;
  oem_number?: string;
}

interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  billingAddress: ShippingAddress;
  shippingAddress: ShippingAddress;
}

// Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      buyer_id, 
      seller_id, 
      items, 
      subtotal, 
      delivery_fee = 0, 
      total, 
      payment_method, 
      delivery_address, 
      delivery_parish, 
      notes 
    } = body;

    // Validate required fields
    if (!buyer_id || !seller_id || !items || !subtotal || !total) {
      return NextResponse.json(
        { error: 'Missing required fields: buyer_id, seller_id, items, subtotal, total' },
        { status: 400 }
      );
    }

    // Generate order number (trigger will handle this, but we can create one for response)
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Insert order into database
    const orderResult = await query(
      `INSERT INTO orders (
        buyer_id, seller_id, order_number, subtotal, delivery_fee, total, 
        payment_method, delivery_address, delivery_parish, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
      RETURNING id, order_number, status, total, created_at`,
      [
        buyer_id, seller_id, orderNumber, subtotal, delivery_fee, total,
        payment_method, delivery_address, delivery_parish, notes
      ]
    );

    const order = orderResult.rows[0];

    // Insert order items if order_items table exists
    try {
      for (const item of items) {
        await query(
          `INSERT INTO order_items (
            order_id, part_id, part_name, quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            order.id, 
            item.id, 
            item.name, 
            item.quantity, 
            item.price, 
            item.price * item.quantity
          ]
        );
      }
    } catch (itemsError) {
      console.log('Order items not saved (table might not exist):', itemsError);
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total: order.total,
        created_at: order.created_at
      }
    });

  } catch (error: any) {
    console.error('Error creating order:', error);
    
    // Handle specific database errors
    if (error.code === '23503') { // Foreign key violation
      return NextResponse.json(
        { error: 'Invalid buyer or seller ID' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// Get orders with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get('buyer_id');
    const sellerId = searchParams.get('seller_id');
    const status = searchParams.get('status');
    const orderId = searchParams.get('order_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCount = 0;

    // Build WHERE clause based on filters
    if (orderId) {
      paramCount++;
      whereConditions.push(`o.id = $${paramCount}`);
      queryParams.push(orderId);
    }

    if (buyerId) {
      paramCount++;
      whereConditions.push(`o.buyer_id = $${paramCount}`);
      queryParams.push(buyerId);
    }

    if (sellerId) {
      paramCount++;
      whereConditions.push(`o.seller_id = $${paramCount}`);
      queryParams.push(sellerId);
    }

    if (status && status !== 'all') {
      paramCount++;
      whereConditions.push(`o.status = $${paramCount}`);
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get orders with buyer and seller info
    const ordersResult = await query(
      `SELECT 
        o.*,
        buyer_profile.name as buyer_name,
        buyer_profile.email as buyer_email,
        seller_profile.name as seller_name,
        seller_profile.email as seller_email
       FROM orders o
       LEFT JOIN profiles buyer_profile ON o.buyer_id = buyer_profile.id
       LEFT JOIN profiles seller_profile ON o.seller_id = seller_profile.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) FROM orders o ${whereClause}`,
      queryParams
    );

    const totalCount = parseInt(countResult.rows[0].count);

    // Get order items if order_items table exists
    const ordersWithItems = [];
    for (const order of ordersResult.rows) {
      let items = [];
      try {
        const itemsResult = await query(
          `SELECT * FROM order_items WHERE order_id = $1`,
          [order.id]
        );
        items = itemsResult.rows;
      } catch (itemsError) {
        console.log('Order items not available:', itemsError);
        // Create mock items for demo
        items = [
          {
            id: '1',
            part_name: 'Auto Part',
            quantity: 1,
            unit_price: order.total,
            total_price: order.total
          }
        ];
      }

      ordersWithItems.push({
        ...order,
        items
      });
    }

    // Calculate stats
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded,
        COALESCE(SUM(total), 0) as total_revenue
      FROM orders
      ${whereClause}
    `, queryParams);

    const stats = statsResult.rows[0];

    return NextResponse.json({
      success: true,
      orders: ordersWithItems,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats
    });

  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// Update order
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      order_id, 
      status, 
      payment_status, 
      tracking_number, 
      notes 
    } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
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

    if (payment_status) {
      paramCount++;
      updateFields.push(`payment_status = $${paramCount}`);
      queryParams.push(payment_status);
    }

    if (tracking_number !== undefined) {
      paramCount++;
      updateFields.push(`tracking_number = $${paramCount}`);
      queryParams.push(tracking_number);
    }

    if (notes !== undefined) {
      paramCount++;
      updateFields.push(`notes = $${paramCount}`);
      queryParams.push(notes);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    paramCount++;
    queryParams.push(order_id);

    const updateResult = await query(
      `UPDATE orders 
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING *`,
      queryParams
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updateResult.rows[0]
    });

  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// Cancel order
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const reason = searchParams.get('reason');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Check if order exists and can be cancelled
    const orderResult = await query(
      `SELECT status FROM orders WHERE id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const currentStatus = orderResult.rows[0].status;
    
    // Only allow cancellation of pending or confirmed orders
    if (!['pending', 'confirmed'].includes(currentStatus)) {
      return NextResponse.json(
        { error: 'Order cannot be cancelled in current status' },
        { status: 400 }
      );
    }

    // Update order status to cancelled
    const updateResult = await query(
      `UPDATE orders 
       SET status = 'cancelled', 
           notes = COALESCE(notes || ' ', '') || $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [reason ? `Cancelled: ${reason}` : 'Order cancelled', orderId]
    );

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: updateResult.rows[0]
    });

  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}