'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const checkoutSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  billingAddress: z.object({
    line1: z.string().min(1, 'Address is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postal_code: z.string().min(5, 'Postal code is required'),
    country: z.string().default('US'),
  }),
  shippingAddress: z.object({
    line1: z.string().min(1, 'Address is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postal_code: z.string().min(5, 'Postal code is required'),
    country: z.string().default('US'),
  }),
  sameAsShipping: z.boolean().default(false),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  });

  const sameAsShipping = watch('sameAsShipping');

  useEffect(() => {
    // Load cart items from localStorage or API
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    if (sameAsShipping) {
      const billingAddress = watch('billingAddress');
      setValue('shippingAddress', billingAddress);
    }
  }, [sameAsShipping, watch, setValue]);

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 100 ? 0 : 15.99; // Free shipping over $100
    return {
      subtotal,
      tax,
      shipping,
      total: subtotal + tax + shipping,
    };
  };

  const onSubmit = async (data: CheckoutForm) => {
    setLoading(true);
    setError('');

    try {
      const { total } = calculateTotal();

      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(total * 100), // Convert to cents
          currency: 'usd',
          customer: {
            email: data.email,
            name: `${data.firstName} ${data.lastName}`,
            phone: data.phone,
          },
          metadata: {
            items: JSON.stringify(cartItems),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // In production, you would use Stripe Elements here
      // For now, we'll simulate a successful payment
      console.log('Payment intent created:', clientSecret);

      // Mock successful payment
      setTimeout(() => {
        setSuccess(true);
        localStorage.removeItem('cart');

        // Create order
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: data,
            items: cartItems,
            total: calculateTotal().total,
            paymentIntentId: 'mock_payment_' + Date.now(),
          }),
        });
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, shipping, total } = calculateTotal();

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
            <p className="text-gray-600 mb-8">
              Thank you for your purchase. We've sent a confirmation email to your address.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-600 mb-2">Order Number</p>
              <p className="text-2xl font-bold">PF-{Date.now()}</p>
            </div>
            <a
              href="/marketplace"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <input
                      {...register('firstName')}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input
                      {...register('lastName')}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Billing Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Address Line 1</label>
                    <input
                      {...register('billingAddress.line1')}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.billingAddress?.line1 && (
                      <p className="text-red-500 text-sm mt-1">{errors.billingAddress.line1.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Address Line 2 (Optional)</label>
                    <input
                      {...register('billingAddress.line2')}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <input
                        {...register('billingAddress.city')}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.billingAddress?.city && (
                        <p className="text-red-500 text-sm mt-1">{errors.billingAddress.city.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State</label>
                      <input
                        {...register('billingAddress.state')}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.billingAddress?.state && (
                        <p className="text-red-500 text-sm mt-1">{errors.billingAddress.state.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">ZIP Code</label>
                      <input
                        {...register('billingAddress.postal_code')}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.billingAddress?.postal_code && (
                        <p className="text-red-500 text-sm mt-1">{errors.billingAddress.postal_code.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Shipping Address</h2>
                  <label className="flex items-center">
                    <input
                      {...register('sameAsShipping')}
                      type="checkbox"
                      className="mr-2"
                    />
                    <span className="text-sm">Same as billing</span>
                  </label>
                </div>
                {!sameAsShipping && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Address Line 1</label>
                      <input
                        {...register('shippingAddress.line1')}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Address Line 2 (Optional)</label>
                      <input
                        {...register('shippingAddress.line2')}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">City</label>
                        <input
                          {...register('shippingAddress.city')}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">State</label>
                        <input
                          {...register('shippingAddress.state')}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">ZIP Code</label>
                        <input
                          {...register('shippingAddress.postal_code')}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    🔒 Secure payment powered by Stripe. In production, card details would be entered here.
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Test mode: Payment will be simulated
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || cartItems.length === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              {cartItems.length === 0 ? (
                <p className="text-gray-500">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (8%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
