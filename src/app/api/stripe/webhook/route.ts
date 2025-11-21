export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ✅ Connection Pool
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
});

// ✅ Simple query function
async function query(text: string, params?: any[]) {
  try {
    console.log('🛢️ Executing query:', text.substring(0, 100));
    const result = await pool.query(text, params);
    console.log('✅ Query successful, rows:', result.rowCount);
    return result;
  } catch (error: any) {
    console.error('❌ Database error:', error.message);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 WEBHOOK STARTED - partsfinda.com');
    
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    console.log('📦 Webhook body received');
    console.log('🔐 Signature:', signature ? 'Present' : 'Missing');

    if (!signature) {
      console.error('❌ No Stripe signature');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET missing');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`🔔 Webhook Event: ${event.type}`);
    console.log('🎯 Event ID:', event.id);
    console.log('🌐 Live Mode:', event.livemode);

    // ✅ Test database immediately
    try {
      const dbTest = await query('SELECT NOW() as time');
      console.log('✅ Database connected:', dbTest.rows[0].time);
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // ✅ Log webhook receipt
    await query(
      'INSERT INTO webhook_logs (event_type, status) VALUES ($1, $2)',
      [event.type, 'received']
    );

    // ✅ PROCESS ALL SUBSCRIPTION EVENTS
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`⚡ Unhandled: ${event.type}`);
    }

    // ✅ Update webhook log to completed
    await query(
      'UPDATE webhook_logs SET status = $1 WHERE event_type = $2 AND created_at > NOW() - INTERVAL \'1 minute\'',
      ['completed', event.type]
    );

    console.log('✅ WEBHOOK COMPLETED SUCCESSFULLY');
    
    return NextResponse.json({ 
      success: true,
      received: true, 
      processed: event.type,
      domain: 'partsfinda.com',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ WEBHOOK FAILED:', error.message);
    
    // ✅ Log error to webhook_errors table
    try {
      await query(
        'INSERT INTO webhook_errors (event_type, error_message) VALUES ($1, $2)',
        ['webhook_failed', error.message]
      );
    } catch (logError) {
      console.error('❌ Failed to log error:', logError);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Webhook processing failed',
        details: error.message 
      },
      { status: 400 }
    );
  }
}

// ✅ CHECKOUT SESSION COMPLETED - WITH COUPON SUPPORT
// ✅ DEBUG VERSION - CHECKOUT SESSION COMPLETED
async function handleCheckoutSessionCompleted(session: any) {
  console.log('💰 CHECKOUT SESSION COMPLETED - DEBUG MODE');
  console.log('📦 Session ID:', session.id);
  console.log('💳 Payment Status:', session.payment_status);
  
  // ✅ COMPLETE SESSION LOGGING
  console.log('🔍 COMPLETE SESSION OBJECT:');
  console.log(JSON.stringify(session, null, 2));
  
  try {
    // ✅ STEP 0: Log webhook receipt
    await query(
      'INSERT INTO webhook_logs (event_type, session_id, status) VALUES ($1, $2, $3)',
      ['checkout.session.completed', session.id, 'received']
    );

    // ✅ Extract metadata safely
    const metadata = session.metadata || {};
    const plan_id = metadata.plan_id;
    const user_id = metadata.user_id;
    const plan_name = metadata.plan_name;

    console.log('📋 Extracted Metadata:', { plan_id, user_id, plan_name });

    // ✅ Check if metadata exists
    if (!plan_id || !user_id) {
      console.error('❌ MISSING METADATA - Cannot process subscription');
      
      await query(
        'INSERT INTO webhook_errors (event_type, session_id, error_message) VALUES ($1, $2, $3)',
        ['checkout.session.completed', session.id, 'Missing plan_id or user_id in metadata']
      );
      
      await query(
        'UPDATE webhook_logs SET status = $1 WHERE session_id = $2',
        ['metadata_missing', session.id]
      );
      return;
    }

    console.log(`🔄 Processing subscription - User: ${user_id}, Plan: ${plan_id}`);

    // ✅ Update webhook log to processing
    await query(
      'UPDATE webhook_logs SET user_id = $1, plan_id = $2, status = $3 WHERE session_id = $4',
      [user_id, plan_id, 'processing', session.id]
    );

    // ✅ STEP 1: Update stripe_sessions status to 'completed'
    const sessionUpdateResult = await query(
      'UPDATE stripe_sessions SET status = $1, amount_total = $2 WHERE session_id = $3 RETURNING id',
      ['completed', session.amount_total ? session.amount_total / 100 : 0, session.id]
    );
    
    if (sessionUpdateResult.rows.length > 0) {
      console.log('✅ Stripe session updated to completed:', sessionUpdateResult.rows[0].id);
    } else {
      console.log('⚠️ Stripe session not found for update:', session.id);
    }

    // ✅ STEP 2: Get plan details
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE plan_id = $1',
      [plan_id]
    );

    if (planResult.rows.length === 0) {
      console.error(`❌ Plan not found: ${plan_id}`);
      
      await query(
        'INSERT INTO webhook_errors (event_type, session_id, error_message) VALUES ($1, $2, $3)',
        ['checkout.session.completed', session.id, `Plan not found: ${plan_id}`]
      );
      
      await query(
        'UPDATE webhook_logs SET status = $1 WHERE session_id = $2',
        ['plan_not_found', session.id]
      );
      return;
    }

    const plan = planResult.rows[0];
    console.log('🎯 Plan found:', plan.plan_name, 'Price:', plan.price);

    // ✅ STEP 3: DEEP DEBUG - FIND COUPON INFORMATION
    console.log('🔍 DEEP COUPON DEBUG START =================================');
    
    let discountAmount = 0;
    let couponCode = null;
    let discountPercentage = 0;

    // Check ALL possible locations for coupon/discount info
    console.log('1. Checking session.discount:', session.discount);
    console.log('2. Checking session.total_details:', session.total_details);
    console.log('3. Checking session.invoice:', session.invoice);
    console.log('4. Checking session.subscription:', session.subscription);
    console.log('5. Checking session.payment_intent:', session.payment_intent);
    
    // Method 1: Check session.discount directly
    if (session.discount) {
      console.log('🎫 Found session.discount:', session.discount);
      if (session.discount.coupon) {
        couponCode = session.discount.coupon.id;
        console.log('🎫 Coupon code from session.discount:', couponCode);
      }
    }

    // Method 2: Check total_details for discount amount
    if (session.total_details && session.total_details.amount_discount) {
      discountAmount = session.total_details.amount_discount / 100;
      console.log('💰 Discount amount from total_details:', discountAmount);
    }

    // Method 3: Retrieve invoice if available
    if (session.invoice) {
      try {
        console.log('🧾 Retrieving invoice:', session.invoice);
        const invoice = await stripe.invoices.retrieve(session.invoice);
        console.log('🧾 Invoice object:', JSON.stringify(invoice, null, 2));
        
        // Check invoice discount
        if (invoice.discount) {
          console.log('🎫 Found invoice.discount:', invoice.discount);
          if (invoice.discount.coupon && !couponCode) {
            couponCode = invoice.discount.coupon.id;
            console.log('🎫 Coupon code from invoice:', couponCode);
          }
        }
        
        // Check invoice discount amounts
        if (invoice.total_discount_amounts && invoice.total_discount_amounts.length > 0) {
          console.log('💰 Invoice discount amounts:', invoice.total_discount_amounts);
          discountAmount = invoice.total_discount_amounts.reduce((sum: number, discount: any) => {
            return sum + (discount.amount / 100);
          }, 0);
        }
        
        // Check line items for discounts
        if (invoice.lines && invoice.lines.data) {
          console.log('📊 Invoice line items count:', invoice.lines.data.length);
          invoice.lines.data.forEach((line: any, index: number) => {
            console.log(`📊 Line ${index}:`, {
              description: line.description,
              amount: line.amount / 100,
              discount_amounts: line.discount_amounts
            });
            
            if (line.discount_amounts && line.discount_amounts.length > 0) {
              const lineDiscount = line.discount_amounts.reduce((sum: number, discount: any) => {
                return sum + (discount.amount / 100);
              }, 0);
              console.log(`💰 Line ${index} discount:`, lineDiscount);
              discountAmount += lineDiscount;
            }
          });
        }
      } catch (invoiceError) {
        console.error('❌ Error retrieving invoice:', invoiceError);
      }
    }

    // Method 4: Retrieve subscription for discount info
    if (session.subscription) {
      try {
        console.log('🔄 Retrieving subscription:', session.subscription);
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        console.log('🔄 Subscription object:', JSON.stringify(subscription, null, 2));
        
        // Check subscription discount
        if (subscription.discount) {
          console.log('🎫 Found subscription.discount:', subscription.discount);
          if (subscription.discount.coupon && !couponCode) {
            couponCode = subscription.discount.coupon.id;
            console.log('🎫 Coupon code from subscription:', couponCode);
          }
        }
      } catch (subscriptionError) {
        console.error('❌ Error retrieving subscription:', subscriptionError);
      }
    }

    // Method 5: Retrieve payment intent for discount info
    if (session.payment_intent) {
      try {
        console.log('💳 Retrieving payment intent:', session.payment_intent);
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
        console.log('💳 Payment intent object:', JSON.stringify(paymentIntent, null, 2));
        
        // Check payment intent for discount info
        if (paymentIntent.invoice) {
          try {
            const piInvoice = await stripe.invoices.retrieve(paymentIntent.invoice);
            console.log('🧾 Payment Intent Invoice:', JSON.stringify(piInvoice, null, 2));
          } catch (piInvoiceError) {
            console.error('❌ Error retrieving payment intent invoice:', piInvoiceError);
          }
        }
      } catch (paymentIntentError) {
        console.error('❌ Error retrieving payment intent:', paymentIntentError);
      }
    }

    console.log('🔍 DEEP COUPON DEBUG END =================================');

    // ✅ STEP 4: Calculate payment amounts
    const originalAmount = plan.price;
    let finalAmount = session.amount_total ? session.amount_total / 100 : originalAmount;

    // If we still don't have discount amount but final amount is different from original
    if (discountAmount === 0 && finalAmount !== originalAmount) {
      discountAmount = originalAmount - finalAmount;
      console.log('💰 Calculated discount amount from difference:', discountAmount);
    }

    // Calculate discount percentage
    if (originalAmount > 0 && discountAmount > 0) {
      discountPercentage = Math.round((discountAmount / originalAmount) * 100);
    }

    // Special case: 100% discount
    if (finalAmount === 0 && originalAmount > 0) {
      discountAmount = originalAmount;
      discountPercentage = 100;
      console.log('💯 100% discount detected');
    }

    console.log('💰 FINAL Payment Breakdown:', {
      originalAmount,
      discountAmount,
      finalAmount,
      discountPercentage: discountPercentage + '%',
      couponCode: couponCode || 'NOT FOUND'
    });

    // ✅ STEP 5: Deactivate existing subscriptions
    const deactivateResult = await query(
      'UPDATE supplier_subscription SET is_active = false WHERE user_id = $1',
      [user_id]
    );
    console.log('📊 Deactivated subscriptions:', deactivateResult.rowCount);

    // ✅ STEP 6: Calculate dates
    const startDate = new Date();
    let validEndDate = new Date();
    
    if (session.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        if (subscription.current_period_end && !isNaN(subscription.current_period_end)) {
          validEndDate = new Date(subscription.current_period_end * 1000);
          console.log('📅 Subscription end date from Stripe:', validEndDate);
        }
      } catch (error) {
        console.error('❌ Error retrieving subscription for dates:', error);
        const durationDays = parseInt(plan.duration_days) || 30;
        validEndDate.setDate(validEndDate.getDate() + durationDays);
      }
    } else {
      const durationDays = parseInt(plan.duration_days) || 30;
      validEndDate.setDate(validEndDate.getDate() + durationDays);
    }

    // ✅ Final validation of dates
    if (isNaN(validEndDate.getTime())) {
      validEndDate = new Date();
      validEndDate.setDate(validEndDate.getDate() + 30);
    }

    // ✅ STEP 7: Create new subscription
    const subscriptionResult = await query(
      `INSERT INTO supplier_subscription (
        user_id, plan_name, start_date, end_date, is_active, renewal_count,
        stripe_subscription_id, stripe_session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        user_id, 
        plan.plan_name, 
        startDate, 
        validEndDate,
        true, 
        0,
        session.subscription || null,
        session.id
      ]
    );
    console.log('✅ Subscription created with ID:', subscriptionResult.rows[0]?.id);

    // ✅ STEP 8: Update user membership_plan
    const userUpdateResult = await query(
      'UPDATE users SET membership_plan = $1 WHERE id = $2 RETURNING id',
      [plan.plan_name.toLowerCase(), user_id]
    );
    console.log('👤 User membership_plan updated:', userUpdateResult.rowCount);

    // ✅ STEP 9: Create record in subscription_payments table
    await query(
      `INSERT INTO subscription_payments (
        user_id, subscription_plan_id, stripe_payment_intent_id, stripe_subscription_id,
        amount, currency, status, payment_method,
        billing_cycle_start, billing_cycle_end,
        original_amount, discount_amount, final_amount, 
        discount_percentage, coupon_code, invoice_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        user_id,
        plan_id,
        session.payment_intent || session.id,
        session.subscription || null,
        finalAmount,
        session.currency?.toUpperCase() || 'USD',
        'completed',
        'card',
        startDate,
        validEndDate,
        originalAmount,
        discountAmount,
        finalAmount,
        discountPercentage,
        couponCode,
        session.invoice_number || `INV-${Date.now()}`
      ]
    );
    console.log('💰 Subscription payment recorded');

    // ✅ STEP 10: Create notification
    let notificationMessage = `Your ${plan.plan_name} subscription has been activated!`;
    if (discountAmount > 0) {
      notificationMessage += ` You saved ${discountPercentage}%`;
      if (couponCode) {
        notificationMessage += ` with coupon ${couponCode}`;
      }
      notificationMessage += `!`;
    }

    await query(
      `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
      [user_id, 'subscription_activated', notificationMessage, 'pending']
    );

    // ✅ STEP 11: Update webhook log to completed
    await query(
      'UPDATE webhook_logs SET status = $1 WHERE session_id = $2',
      ['completed', session.id]
    );

    console.log(`🎉 SUBSCRIPTION SUCCESS: User ${user_id}, Plan ${plan.plan_name}`);
    console.log('💰 FINAL Payment details:', {
      originalAmount,
      discountAmount,
      finalAmount,
      discountPercentage: discountPercentage + '%',
      couponCode: couponCode || 'Not found'
    });

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in checkout handler:', error.message);
    console.error('🔍 Error stack:', error.stack);
    
    try {
      await query(
        'INSERT INTO webhook_errors (event_type, session_id, error_message) VALUES ($1, $2, $3)',
        ['checkout.session.completed', session.id, error.message]
      );
      
      await query(
        'UPDATE webhook_logs SET status = $1 WHERE session_id = $2',
        ['failed', session.id]
      );
    } catch (logError) {
      console.error('❌ Failed to log error:', logError);
    }
  }
}

// ✅ SUBSCRIPTION CREATED
async function handleSubscriptionCreated(subscription: any) {
  console.log(`📝 Subscription created: ${subscription.id}`);
  console.log('📊 Subscription status:', subscription.status);
  
  try {
    // Update subscription status in database
    await query(
      'UPDATE supplier_subscription SET is_active = $1 WHERE stripe_subscription_id = $2',
      [subscription.status === 'active', subscription.id]
    );
    
    console.log(`✅ Subscription ${subscription.id} status updated to: ${subscription.status}`);
  } catch (error) {
    console.error('❌ Error handling subscription created:', error);
  }
}

// ✅ SUBSCRIPTION UPDATED
async function handleSubscriptionUpdated(subscription: any) {
  console.log(`🔄 Subscription updated: ${subscription.id}`);
  console.log('📊 New status:', subscription.status);
  
  try {
    // ✅ SAFE: Calculate end date
    let validEndDate = new Date();
    if (subscription.current_period_end && !isNaN(subscription.current_period_end)) {
      validEndDate = new Date(subscription.current_period_end * 1000);
    } else {
      // Fallback: add 30 days
      validEndDate.setDate(validEndDate.getDate() + 30);
    }
    
    await query(
      'UPDATE supplier_subscription SET end_date = $1, is_active = $2 WHERE stripe_subscription_id = $3',
      [validEndDate, subscription.status === 'active', subscription.id]
    );

    console.log(`✅ Subscription updated: ${subscription.id}`);
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
  }
}

// ✅ SUBSCRIPTION DELETED/CANCELED
async function handleSubscriptionDeleted(subscription: any) {
  console.log(`🗑️ Subscription deleted: ${subscription.id}`);
  
  try {
    // Deactivate subscription
    const result = await query(
      'UPDATE supplier_subscription SET is_active = false WHERE stripe_subscription_id = $1 RETURNING user_id',
      [subscription.id]
    );

    if (result.rows.length > 0) {
      const userId = result.rows[0].user_id;
      
      // Reset user plan to free
      await query(
        'UPDATE users SET membership_plan = $1 WHERE id = $2',
        ['free', userId]
      );

      // Create notification
      await query(
        `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
        [userId, 'subscription_canceled', 'Your subscription has been canceled', 'pending']
      );

      console.log(`✅ Subscription deactivated for user: ${userId}`);
    }
  } catch (error) {
    console.error('❌ Error handling subscription deletion:', error);
  }
}

// ✅ SUBSCRIPTION: Recurring Payment Succeeded
async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log(`💰 Recurring payment succeeded: ${invoice.id}`);
  console.log('💳 Amount paid:', invoice.amount_paid / 100);
  
  try {
    if (invoice.subscription) {
      // ✅ SAFE: Calculate new end date
      let newEndDate = new Date();
      try {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        if (subscription.current_period_end && !isNaN(subscription.current_period_end)) {
          newEndDate = new Date(subscription.current_period_end * 1000);
        }
      } catch (error) {
        console.error('❌ Error retrieving subscription for renewal:', error);
        // Fallback: add 30 days
        newEndDate.setDate(newEndDate.getDate() + 30);
      }

      // Extend subscription end date
      await query(
        `UPDATE supplier_subscription 
         SET end_date = $1, renewal_count = renewal_count + 1 
         WHERE stripe_subscription_id = $2`,
        [newEndDate, invoice.subscription]
      );

      // Create renewal notification
      const subResult = await query(
        'SELECT user_id, plan_name FROM supplier_subscription WHERE stripe_subscription_id = $1',
        [invoice.subscription]
      );

      if (subResult.rows.length > 0) {
        const { user_id, plan_name } = subResult.rows[0];
        
        await query(
          `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
          [user_id, 'subscription_renewed', `Your ${plan_name} subscription has been renewed`, 'pending']
        );
      }

      console.log(`✅ Subscription renewed: ${invoice.subscription}`);
    }
  } catch (error) {
    console.error('❌ Error handling invoice payment:', error);
  }
}

// ✅ SUBSCRIPTION: Recurring Payment Failed
async function handleInvoicePaymentFailed(invoice: any) {
  console.log(`❌ Recurring payment failed: ${invoice.id}`);
  
  try {
    // Send notification to user
    if (invoice.subscription) {
      const subResult = await query(
        'SELECT user_id, plan_name FROM supplier_subscription WHERE stripe_subscription_id = $1',
        [invoice.subscription]
      );

      if (subResult.rows.length > 0) {
        const { user_id, plan_name } = subResult.rows[0];
        
        await query(
          `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
          [user_id, 'payment_failed', `Payment failed for your ${plan_name} subscription. Please update your payment method.`, 'pending']
        );

        console.log(`⚠️ Payment failed notification sent to user: ${user_id}`);
      }
    }
  } catch (error) {
    console.error('❌ Error handling failed invoice:', error);
  }
}

// ✅ GET method for testing
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const test = url.searchParams.get('test');
  
  if (test === 'db') {
    try {
      const result = await query('SELECT NOW() as time, version() as version');
      return NextResponse.json({
        success: true,
        database: 'connected',
        time: result.rows[0].time,
        version: result.rows[0].version
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Stripe webhook endpoint active - partsfinda.com',
    domain: 'partsfinda.com',
    timestamp: new Date().toISOString()
  });
}