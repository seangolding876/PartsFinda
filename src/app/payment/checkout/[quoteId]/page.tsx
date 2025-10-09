'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  CreditCard,
  Shield,
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Truck,
  Clock,
  Phone,
  Mail,
  MapPin,
  Star,
  Package,
  DollarSign,
  Info
} from 'lucide-react';
import { PAYMENT_CONFIG, PaymentSecurity } from '@/lib/stripe';

// Load Stripe with publishable key
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
                             process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST!;
const stripePromise = loadStripe(stripePublishableKey);

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

function CheckoutForm() {
  const router = useRouter();
  const params = useParams();
  const quoteId = params.quoteId as string;
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Review, 2: Payment, 3: Confirmation
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [clientSecret, setClientSecret] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  // Demo quote data (in production, fetch from API)
  const quote = {
    id: quoteId,
    partName: 'Premium Ceramic Brake Pads Set',
    supplier: {
      name: 'Kingston Auto Parts',
      rating: 4.8,
      reviews: 127,
      location: 'Kingston, Jamaica',
      phone: '+876 922 1234',
      email: 'info@kingstonauto.com',
      verified: true
    },
    buyer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+876 555 0123'
    },
    vehicle: {
      year: '2020',
      make: 'Toyota',
      model: 'Camry'
    },
    partDetails: {
      partNumber: 'BRK-TOY-CAM-001',
      brand: 'OEM',
      condition: 'New',
      warranty: '2 Years',
      quantity: 1,
      features: ['Ceramic Compound', 'Low Noise', 'Extended Life', 'Free Installation Guide']
    },
    pricing: {
      partPrice: 8200,
      deliveryFee: 500,
      serviceFee: 246, // 3% service fee
      total: 8946
    },
    delivery: {
      method: 'Local Delivery',
      estimatedTime: '1-2 Days',
      address: '123 Main Street, Kingston'
    },
    paymentTerms: 'Secure escrow payment - funds released after confirmation',
    validUntil: '2024-01-25'
  };

  const [paymentData, setPaymentData] = useState({
    billingAddress: {
      street: '',
      city: '',
      parish: '',
      postalCode: ''
    },
    saveCard: false,
    agreeToTerms: false
  });

  const [orderData, setOrderData] = useState({
    specialInstructions: '',
    preferredDeliveryTime: '',
    contactMethod: 'phone'
  });

  useEffect(() => {
    // Validate amount
    if (!PaymentSecurity.validateAmount(quote.pricing.total)) {
      setError(`Amount must be between J${PAYMENT_CONFIG.minimumAmount/100} and J${PAYMENT_CONFIG.maximumAmount/100}`);
      return;
    }

    // Log payment attempt for security monitoring
    PaymentSecurity.logPaymentAttempt({
      userId: quote.buyer.email,
      amount: quote.pricing.total,
      ip: 'client-ip', // In production, get from request
      userAgent: navigator.userAgent
    });
  }, [quote.buyer.email, quote.pricing.total]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: quote.pricing.total,
          currency: PAYMENT_CONFIG.currency,
          orderId: `ORDER-${Date.now()}`,
          buyerId: quote.buyer.email,
          supplierId: quote.supplier.email,
          quoteId: quote.id,
          buyerEmail: quote.buyer.email,
          description: `${quote.partName} for ${quote.vehicle.year} ${quote.vehicle.make} ${quote.vehicle.model}`,
          metadata: PaymentSecurity.sanitizeMetadata({
            partName: quote.partName,
            vehicle: `${quote.vehicle.year} ${quote.vehicle.make} ${quote.vehicle.model}`,
            supplier: quote.supplier.name,
            deliveryMethod: quote.delivery.method
          })
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      return data;

    } catch (err: any) {
      console.error('Error creating payment intent:', err);
      throw new Error(err.message || 'Payment setup failed');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    if (!paymentData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create payment intent if not already created
      let paymentIntentData;
      if (!clientSecret) {
        paymentIntentData = await createPaymentIntent();
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret || paymentIntentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: quote.buyer.name,
              email: quote.buyer.email,
              phone: quote.buyer.phone,
              address: {
                line1: paymentData.billingAddress.street,
                city: paymentData.billingAddress.city,
                state: paymentData.billingAddress.parish,
                postal_code: paymentData.billingAddress.postalCode,
                country: 'JM',
              },
            },
          },
          setup_future_usage: paymentData.saveCard ? 'off_session' : undefined,
        }
      );

      if (stripeError) {
        console.error('Stripe error:', stripeError);
        setError(stripeError.message || 'Payment failed. Please try again.');
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        setPaymentStatus('succeeded');
        setStep(3);

        // Create order record in database
        await createOrderRecord({
          paymentIntentId: paymentIntent.id,
          quote,
          orderData,
          paymentData
        });

      } else {
        throw new Error('Payment was not completed successfully');
      }

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createOrderRecord = async (orderDetails: any) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderDetails),
      });

      if (!response.ok) {
        throw new Error('Failed to create order record');
      }

      const orderData = await response.json();
      console.log('Order created:', orderData);

    } catch (error) {
      console.error('Error creating order record:', error);
      // Don't throw error here as payment already succeeded
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setPaymentData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setPaymentData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (name.includes('order')) {
      const fieldName = name.replace('order.', '');
      setOrderData(prev => ({
        ...prev,
        [fieldName]: value
      }));
    } else {
      setPaymentData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const formatCurrency = (amount: number) => {
    return `J$${amount.toLocaleString()}`;
  };

  // Card element styling
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: '"Inter", sans-serif',
        fontSmoothing: 'antialiased',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">Secure Checkout</h1>
          <p className="text-gray-600">Complete your purchase with confidence</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[
              { number: 1, title: 'Review Order', active: step >= 1, completed: step > 1 },
              { number: 2, title: 'Payment', active: step >= 2, completed: step > 2 },
              { number: 3, title: 'Confirmation', active: step >= 3, completed: step > 3 }
            ].map((stepItem, index) => (
              <div key={stepItem.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  stepItem.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : stepItem.active
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {stepItem.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    stepItem.number
                  )}
                </div>
                <div className="ml-2 mr-8">
                  <p className={`text-sm font-medium ${
                    stepItem.active ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {stepItem.title}
                  </p>
                </div>
                {index < 2 && (
                  <div className={`h-0.5 w-16 ${
                    stepItem.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary (Sidebar) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Order Summary</h3>

              {/* Part Details */}
              <div className="border-b pb-6 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">{quote.partName}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  For {quote.vehicle.year} {quote.vehicle.make} {quote.vehicle.model}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Part Number:</span>
                    <span className="font-mono">{quote.partDetails.partNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Brand:</span>
                    <span>{quote.partDetails.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Condition:</span>
                    <span>{quote.partDetails.condition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Warranty:</span>
                    <span>{quote.partDetails.warranty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span>{quote.partDetails.quantity}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {quote.partDetails.features.map((feature, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Supplier Info */}
              <div className="border-b pb-6 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Supplier</h4>
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-100 rounded-full w-10 h-10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800">{quote.supplier.name}</h5>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-sm">{quote.supplier.rating}</span>
                      </div>
                      <span className="text-xs text-gray-500">({quote.supplier.reviews} reviews)</span>
                      {quote.supplier.verified && (
                        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {quote.supplier.location}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    {quote.supplier.phone}
                  </p>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="border-b pb-6 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Delivery</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>{quote.delivery.method}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{quote.delivery.estimatedTime}</span>
                  </div>
                  <p className="text-gray-600">{quote.delivery.address}</p>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Part Price:</span>
                  <span>{formatCurrency(quote.pricing.partPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee:</span>
                  <span>{formatCurrency(quote.pricing.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Service Fee ({PAYMENT_CONFIG.platformFeePercentage}%):</span>
                  <span>{formatCurrency(quote.pricing.serviceFee)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(quote.pricing.total)}</span>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium text-sm">Secure Escrow Payment</span>
                </div>
                <p className="text-xs text-blue-700">
                  Your payment is held securely for {PAYMENT_CONFIG.escrowHoldDays} days until you confirm receipt. Full refund protection included.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Review Your Order</h3>

                <div className="space-y-6">
                  {/* Order Confirmation */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Quote Accepted</span>
                    </div>
                    <p className="text-sm text-green-700">
                      You've accepted the quote from {quote.supplier.name} for {quote.partName}.
                    </p>
                  </div>

                  {/* Special Instructions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      name="order.specialInstructions"
                      value={orderData.specialInstructions}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any special delivery instructions or notes for the supplier..."
                    />
                  </div>

                  {/* Preferred Contact Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Contact Method
                    </label>
                    <select
                      name="order.contactMethod"
                      value={orderData.contactMethod}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                      <option value="message">Platform Messages</option>
                    </select>
                  </div>

                  {/* Terms Notice */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-1">Important Information</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Payment will be held in secure escrow for {PAYMENT_CONFIG.escrowHoldDays} days</li>
                          <li>• You have {PAYMENT_CONFIG.escrowHoldDays} days to inspect and confirm the part</li>
                          <li>• Full refund available if part doesn't match description</li>
                          <li>• Supplier will contact you within 24 hours to arrange delivery</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Payment Information</h3>

                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                    <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                        <div>
                          <h4 className="font-medium">Credit/Debit Card</h4>
                          <p className="text-sm text-gray-600">Secure payment via Stripe</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Card Information</h4>

                    <div className="border border-gray-300 rounded-lg p-4">
                      <CardElement options={cardElementOptions} />
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Billing Address</h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                      <input
                        type="text"
                        name="billingAddress.street"
                        value={paymentData.billingAddress.street}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          name="billingAddress.city"
                          value={paymentData.billingAddress.city}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Kingston"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Parish</label>
                        <select
                          name="billingAddress.parish"
                          value={paymentData.billingAddress.parish}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Parish</option>
                          <option value="Kingston">Kingston</option>
                          <option value="St. Andrew">St. Andrew</option>
                          <option value="St. Catherine">St. Catherine</option>
                          <option value="Spanish Town">Spanish Town</option>
                          <option value="Portmore">Portmore</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Security Features */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <Lock className="w-4 h-4" />
                      <span className="font-medium text-sm">256-bit SSL Encryption</span>
                    </div>
                    <p className="text-xs text-green-700">
                      Your payment information is encrypted and processed securely by Stripe.
                      We never store your card details.
                    </p>
                  </div>

                  {/* Save Card Option */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="saveCard"
                      checked={paymentData.saveCard}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-700">
                      Save payment method for future purchases (optional)
                    </label>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={paymentData.agreeToTerms}
                      onChange={handleChange}
                      required
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-700">
                      I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
                      <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
                      I understand that payment will be held in secure escrow until I confirm receipt of the part.
                    </label>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !stripe}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          Pay {formatCurrency(quote.pricing.total)}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && paymentStatus === 'succeeded' && (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="mb-8">
                  <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Payment Successful!</h3>
                  <p className="text-lg text-gray-600">
                    Your order has been confirmed and payment is held securely in escrow.
                  </p>
                </div>

                {/* Order Details */}
                <div className="bg-gray-50 rounded-lg p-6 text-left mb-8">
                  <h4 className="font-semibold text-gray-800 mb-4">Order Confirmation</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Order ID</p>
                      <p className="font-medium">ORD-{Date.now().toString().slice(-8)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Payment Method</p>
                      <p className="font-medium">**** **** **** ****</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Amount Paid</p>
                      <p className="font-medium text-green-600">{formatCurrency(quote.pricing.total)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className="font-medium text-green-600">Payment Confirmed</p>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left mb-8">
                  <h4 className="font-semibold text-blue-800 mb-4">What happens next?</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                    <li>The supplier will contact you within 24 hours to arrange delivery</li>
                    <li>Your payment is held securely in escrow for {PAYMENT_CONFIG.escrowHoldDays} days</li>
                    <li>Once you receive and inspect the part, confirm the order</li>
                    <li>Payment will be released to the supplier after confirmation</li>
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/my-requests')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    View My Orders
                  </button>

                  <button
                    onClick={() => router.push('/messages')}
                    className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Message Supplier
                  </button>
                </div>

                {/* Contact Support */}
                <div className="mt-8 pt-6 border-t">
                  <p className="text-sm text-gray-600">
                    Need help? Contact our support team at{' '}
                    <a href="mailto:support@partfinda.com" className="text-blue-600 hover:underline">
                      support@partfinda.com
                    </a>
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
