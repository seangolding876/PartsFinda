'use client';

import Link from 'next/link';
import { useCart } from '@/lib/CartContext';

export default function CartPage() {
  const { items: cartItems, updateQuantity, removeItem } = useCart();

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 15.99; // Free shipping over $100
  const tax = subtotal * 0.0875; // 8.75% tax
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {cartItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-gray-600 mb-4">Add some parts to get started</p>
                <Link href="/marketplace" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-block">
                  Browse Parts
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Items ({cartItems.length})</h2>
                  <div className="space-y-4">
                    {cartItems.map(item => (
                      <div key={item.id} className="border-b pb-4">
                        <div className="flex gap-4">
                          <div className="text-5xl">{item.image || '🔧'}</div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-gray-600">{item.vehicle}</p>
                            <p className="text-sm text-gray-600">Sold by: {item.seller}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-8 h-8 border rounded hover:bg-gray-100"
                                >
                                  -
                                </button>
                                <span className="w-12 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-8 h-8 border rounded hover:bg-gray-100"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                            <p className="text-sm text-gray-600">${item.price} each</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            {cartItems.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 mt-6 block text-center"
                >
                  Proceed to Checkout
                </Link>

                <div className="mt-4">
                  <p className="text-sm text-gray-600 text-center">
                    or{' '}
                    <Link href="/marketplace" className="text-blue-600 hover:text-blue-800">
                      Continue Shopping
                    </Link>
                  </p>
                </div>

                {/* Security Badge */}
                <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>🔒</span>
                    <span>Secure checkout powered by Stripe</span>
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📦 Free shipping on orders over $100
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
