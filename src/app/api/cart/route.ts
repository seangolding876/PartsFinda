import { NextRequest, NextResponse } from 'next/server';

// In-memory cart storage (in production, use database or session)
let carts = new Map();

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || 'guest';
    const cart = carts.get(userId) || [];

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ cart: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'guest', item } = body;

    let cart = carts.get(userId) || [];

    // Check if item already exists
    const existingIndex = cart.findIndex((i: any) => i.id === item.id);
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += item.quantity || 1;
    } else {
      cart.push({ ...item, quantity: item.quantity || 1 });
    }

    carts.set(userId, cart);

    return NextResponse.json({ success: true, cart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'guest', itemId, quantity } = body;

    let cart = carts.get(userId) || [];

    if (quantity === 0) {
      cart = cart.filter((item: any) => item.id !== itemId);
    } else {
      const itemIndex = cart.findIndex((i: any) => i.id === itemId);
      if (itemIndex >= 0) {
        cart[itemIndex].quantity = quantity;
      }
    }

    carts.set(userId, cart);

    return NextResponse.json({ success: true, cart });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || 'guest';
    carts.delete(userId);

    return NextResponse.json({ success: true, cart: [] });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
  }
}
