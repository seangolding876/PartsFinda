import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

interface Order {
  id: string;
  customer_info: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'canceled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_intent_id?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  estimated_delivery?: string;
  notes?: string;
}

// Mock orders database
let orders: Order[] = [
  {
    id: 'ord_12345',
    customer_info: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phone: '+1-555-0123',
      billingAddress: {
        line1: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        postal_code: '90210',
        country: 'US'
      },
      shippingAddress: {
        line1: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        postal_code: '90210',
        country: 'US'
      }
    },
    items: [
      {
        id: '1',
        name: 'Brake Pads - Premium Ceramic',
        price: 89.99,
        quantity: 1,
        seller_id: 'seller_1',
        seller_name: 'AutoParts Pro',
        image_url: '🔧',
        part_number: 'BP-123456'
      }
    ],
    subtotal: 89.99,
    tax: 7.20,
    shipping: 9.99,
    total: 107.18,
    status: 'confirmed',
    payment_status: 'paid',
    payment_intent_id: 'pi_mock_12345',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

function generateOrderId(): string {
  return 'ord_' + Math.random().toString(36).substr(2, 9);
}

function calculateOrderTotals(items: OrderItem[], shippingCost: number = 9.99, taxRate: number = 0.08) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : shippingCost; // Free shipping over $100
  const tax = subtotal * taxRate;
  const total = subtotal + tax + shipping;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

// Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerInfo, items, paymentIntentId, total: providedTotal } = body;

    // Validate required fields
    if (!customerInfo || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customerInfo, items' },
        { status: 400 }
      );
    }

    // Validate customer info
    const requiredCustomerFields = ['firstName', 'lastName', 'email', 'shippingAddress'];
    for (const field of requiredCustomerFields) {
      if (!customerInfo[field]) {
        return NextResponse.json(
          { error: `Missing required customer field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Calculate order totals
    const totals = calculateOrderTotals(items);

    // Verify total if provided
    if (providedTotal && Math.abs(providedTotal - totals.total) > 0.01) {
      return NextResponse.json(
        { error: 'Total amount mismatch' },
        { status: 400 }
      );
    }

    // Create new order
    const newOrder: Order = {
      id: generateOrderId(),
      customer_info: customerInfo,
      items,
      ...totals,
      status: 'pending',
      payment_status: paymentIntentId ? 'paid' : 'pending',
      payment_intent_id: paymentIntentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };

    try {
      // Try to save to Supabase
      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()
        .single();

      if (error) {
        console.log('Supabase error, using mock database:', error.message);
        orders.push(newOrder);
      } else {
        console.log('Order saved to database');
      }
    } catch (dbError) {
      console.log('Database unavailable, using mock storage');
      orders.push(newOrder);
    }

    // Send order confirmation email (mock)
    console.log(`📧 Order confirmation email sent to ${customerInfo.email}`);

    // Notify sellers about new orders (mock)
    const uniqueSellers = [...new Set(items.map(item => item.seller_id))];
    console.log(`🔔 Notified ${uniqueSellers.length} sellers about new order`);

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: newOrder.id,
        status: newOrder.status,
        payment_status: newOrder.payment_status,
        total: newOrder.total,
        created_at: newOrder.created_at,
        estimated_delivery: newOrder.estimated_delivery
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// Get orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const customerEmail = searchParams.get('customerEmail');
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let filteredOrders = [...orders];

    // Filter by specific order ID
    if (orderId) {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        order
      });
    }

    // Filter by customer email
    if (customerEmail) {
      filteredOrders = filteredOrders.filter(order =>
        order.customer_info.email.toLowerCase() === customerEmail.toLowerCase()
      );
    }

    // Filter by seller ID
    if (sellerId) {
      filteredOrders = filteredOrders.filter(order =>
        order.items.some(item => item.seller_id === sellerId)
      );
    }

    // Filter by status
    if (status && status !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    // Sort by creation date (newest first)
    filteredOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination
    const paginatedOrders = filteredOrders.slice(offset, offset + limit);

    // Calculate stats
    const stats = {
      total: filteredOrders.length,
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      confirmed: filteredOrders.filter(o => o.status === 'confirmed').length,
      processing: filteredOrders.filter(o => o.status === 'processing').length,
      shipped: filteredOrders.filter(o => o.status === 'shipped').length,
      delivered: filteredOrders.filter(o => o.status === 'delivered').length,
      canceled: filteredOrders.filter(o => o.status === 'canceled').length,
      totalRevenue: filteredOrders.reduce((sum, order) => sum + order.total, 0)
    };

    return NextResponse.json({
      success: true,
      orders: paginatedOrders,
      pagination: {
        total: filteredOrders.length,
        limit,
        offset,
        hasMore: offset + limit < filteredOrders.length
      },
      stats
    });

  } catch (error) {
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
    const { orderId, status, tracking_number, notes, estimated_delivery } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const orderIndex = orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order
    const updatedOrder = { ...orders[orderIndex] };

    if (status) {
      updatedOrder.status = status;
    }

    if (tracking_number) {
      updatedOrder.tracking_number = tracking_number;
    }

    if (notes) {
      updatedOrder.notes = notes;
    }

    if (estimated_delivery) {
      updatedOrder.estimated_delivery = estimated_delivery;
    }

    updatedOrder.updated_at = new Date().toISOString();

    orders[orderIndex] = updatedOrder;

    try {
      // Try to update in Supabase
      const { error } = await supabase
        .from('orders')
        .update({
          status: updatedOrder.status,
          tracking_number: updatedOrder.tracking_number,
          notes: updatedOrder.notes,
          estimated_delivery: updatedOrder.estimated_delivery,
          updated_at: updatedOrder.updated_at
        })
        .eq('id', orderId);

      if (error) {
        console.log('Supabase update error:', error.message);
      }
    } catch (dbError) {
      console.log('Database update failed, using mock storage');
    }

    // Send status update notifications
    if (status) {
      console.log(`📧 Order status update email sent to ${updatedOrder.customer_info.email}`);

      if (status === 'shipped' && tracking_number) {
        console.log(`📦 Shipping notification sent with tracking: ${tracking_number}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    });

  } catch (error) {
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
    const orderId = searchParams.get('orderId');
    const reason = searchParams.get('reason');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const orderIndex = orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orders[orderIndex];

    // Check if order can be canceled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Order cannot be canceled in current status' },
        { status: 400 }
      );
    }

    // Update order status to canceled
    orders[orderIndex] = {
      ...order,
      status: 'canceled',
      notes: reason ? `Canceled: ${reason}` : 'Order canceled',
      updated_at: new Date().toISOString()
    };

    try {
      // Try to update in Supabase
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'canceled',
          notes: orders[orderIndex].notes,
          updated_at: orders[orderIndex].updated_at
        })
        .eq('id', orderId);

      if (error) {
        console.log('Supabase update error:', error.message);
      }
    } catch (dbError) {
      console.log('Database update failed, using mock storage');
    }

    // Process refund if payment was made
    if (order.payment_status === 'paid' && order.payment_intent_id) {
      console.log(`💰 Refund initiated for payment intent: ${order.payment_intent_id}`);
      // In production, process actual refund through Stripe
    }

    // Send cancellation notifications
    console.log(`📧 Order cancellation email sent to ${order.customer_info.email}`);

    return NextResponse.json({
      success: true,
      message: 'Order canceled successfully',
      order: orders[orderIndex]
    });

  } catch (error) {
    console.error('Error canceling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
