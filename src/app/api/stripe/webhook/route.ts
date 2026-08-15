export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

//  Connection Pool
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
});

//  Simple query function
async function query(text: string, params?: any[]) {
  try {
    console.log('🛢️ Executing query:', text.substring(0, 100));
    const result = await pool.query(text, params);
    console.log(' Query successful, rows:', result.rowCount);
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

    //  Test database immediately
    try {
      const dbTest = await query('SELECT NOW() as time');
      console.log(' Database connected:', dbTest.rows[0].time);
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    //  Log webhook receipt
    await query(
      'INSERT INTO webhook_logs (event_type, status) VALUES ($1, $2)',
      [event.type, 'received']
    );

    //  PROCESS ALL SUBSCRIPTION EVENTS
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

    //  Update webhook log to completed
    await query(
      'UPDATE webhook_logs SET status = $1 WHERE event_type = $2 AND created_at > NOW() - INTERVAL \'1 minute\'',
      ['completed', event.type]
    );

    console.log(' WEBHOOK COMPLETED SUCCESSFULLY');
    
    return NextResponse.json({ 
      success: true,
      received: true, 
      processed: event.type,
      domain: 'partsfinda.com',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ WEBHOOK FAILED:', error.message);
    
    //  Log error to webhook_errors table
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

//  CHECKOUT SESSION COMPLETED - WITH COUPON SUPPORT
//  CHECKOUT SESSION COMPLETED - WITH DYNAMIC PLAN NAME VALIDATION
async function handleCheckoutSessionCompleted(session: any) {
  console.log('💰 CHECKOUT SESSION COMPLETED');
  console.log('📦 Session ID:', session.id);
  console.log('💳 Payment Status:', session.payment_status);
  
  try {
    //  STEP 0: Log webhook receipt
    await query(
      'INSERT INTO webhook_logs (event_type, session_id, status) VALUES ($1, $2, $3)',
      ['checkout.session.completed', session.id, 'received']
    );

    //  Extract metadata safely
    const metadata = session.metadata || {};
    const plan_id = metadata.plan_id;
    const user_id = metadata.user_id;
    const plan_name = metadata.plan_name;


    // handleCheckoutSessionCompleted function ke start mein
console.log('🔄 UPGRADE CHECK - Session Metadata:', {
  plan_id: metadata.plan_id,
  user_id: metadata.user_id,
  plan_name: metadata.plan_name,
  is_upgrade: metadata.is_upgrade, // Yeh aapne checkout session mein add kiya hai
  existing_subscription_id: metadata.existing_subscription_id
});

    console.log('📋 Extracted Metadata:', { plan_id, user_id, plan_name });

    //  Check if metadata exists
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

    //  Update webhook log to processing
    await query(
      'UPDATE webhook_logs SET user_id = $1, plan_id = $2, status = $3 WHERE session_id = $4',
      [user_id, plan_id, 'processing', session.id]
    );

    //  STEP 1: Update stripe_sessions status to 'completed'
    const sessionUpdateResult = await query(
      'UPDATE stripe_sessions SET status = $1, amount_total = $2 WHERE session_id = $3 RETURNING id',
      ['completed', session.amount_total ? session.amount_total / 100 : 0, session.id]
    );
    
    if (sessionUpdateResult.rows.length > 0) {
      console.log(' Stripe session updated to completed:', sessionUpdateResult.rows[0].id);
    } else {
      console.log('⚠️ Stripe session not found for update:', session.id);
    }

    //  STEP 2: Get plan details
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

    //  STEP 2.5: DYNAMIC PLAN NAME VALIDATION
    let allowedPlanNames = ['Basic', 'Premium', 'Enterprise'];
    
    try {
      // Try to get allowed plan names from database constraint dynamically
      const constraintResult = await query(`
        SELECT conname, pg_get_constraintdef(oid) as constraint_def
        FROM pg_constraint 
        WHERE conrelid = 'supplier_subscription'::regclass 
        AND contype = 'c'
        AND conname LIKE '%plan_name%'
      `);
      
      if (constraintResult.rows.length > 0) {
        console.log('🔍 Found constraint:', constraintResult.rows[0].conname);
        const constraintDef = constraintResult.rows[0].constraint_def;
        console.log('🔍 Constraint definition:', constraintDef);
        
        // Extract allowed values from constraint definition
        const matches = constraintDef.match(/'([^']*)'/g);
        if (matches) {
          allowedPlanNames = matches.map((m: string) => m.replace(/'/g, ''));
          console.log(' Dynamic allowed plan names from constraint:', allowedPlanNames);
        }
      } else {
        console.log('ℹ️ No constraint found, using default allowed names');
      }
    } catch (error) {
      console.log('⚠️ Could not fetch constraint, using default allowed names:', allowedPlanNames);
    }

    // Map plan name to allowed values
    const rawPlanName = (plan.plan_name || '').trim();
    
    // First try exact match
    let exactPlanNameForSubscription = allowedPlanNames.find(name => 
      name.toLowerCase() === rawPlanName.toLowerCase()
    );

    // If not found, use intelligent mapping
    if (!exactPlanNameForSubscription) {
      const planNameMapping: { [key: string]: string } = {
        'basic': 'Basic',
        'premium': 'Premium',
        'enterprise': 'Enterprise',
      };
      
      const normalizedKey = rawPlanName.toLowerCase();
      exactPlanNameForSubscription = planNameMapping[normalizedKey] || 
                                   allowedPlanNames[0] || // Fallback to first allowed
                                   'Basic';
    }

    const normalizedPlanNameForUser = rawPlanName.toLowerCase();

    console.log('🔧 Dynamic Plan Name Mapping:', {
      original: rawPlanName,
      allowedNames: allowedPlanNames,
      exactForSubscription: exactPlanNameForSubscription,
      forUser: normalizedPlanNameForUser
    });

    //  STEP 3: GET COUPON DETAILS FROM INVOICE
    let discountAmount = 0;
    let couponCode = null;
    let discountPercentage = 0;
    let invoiceDetails = null;

    try {
      // Get invoice from session
      if (session.invoice) {
        const invoice = await stripe.invoices.retrieve(session.invoice);
        console.log('🧾 Invoice details:', JSON.stringify(invoice, null, 2));
        
        invoiceDetails = invoice;

        // Check for discount in invoice
        if (invoice.discount) {
          console.log('🎫 Discount found in invoice:', invoice.discount);
          
          if (invoice.discount.coupon) {
            couponCode = invoice.discount.coupon.id;
            console.log('🎫 Coupon code from invoice:', couponCode);
          }
          
          // Calculate discount amount from invoice totals
          if (invoice.total_discount_amounts && invoice.total_discount_amounts.length > 0) {
            discountAmount = invoice.total_discount_amounts.reduce((sum: number, discount: any) => {
              return sum + (discount.amount / 100);
            }, 0);
            console.log('💰 Total discount amount from invoice:', discountAmount);
          }
        }

        // Alternative: Check line items for discounts
        if (invoice.lines && invoice.lines.data) {
          for (const line of invoice.lines.data) {
            if (line.discount_amounts && line.discount_amounts.length > 0) {
              const lineDiscount = line.discount_amounts.reduce((sum: number, discount: any) => {
                return sum + (discount.amount / 100);
              }, 0);
              console.log('📊 Line item discount:', lineDiscount);
              discountAmount += lineDiscount;
            }
          }
        }
      }
    } catch (invoiceError) {
      console.error('❌ Error retrieving invoice:', invoiceError);
    }

    //  STEP 4: Calculate payment amounts with coupon discount
    const originalAmount = plan.price; // Original plan price
    let finalAmount = session.amount_total ? session.amount_total / 100 : originalAmount;

    // If we couldn't get discount from invoice, calculate from session amounts
    if (discountAmount === 0 && session.total_details && session.total_details.amount_discount) {
      discountAmount = session.total_details.amount_discount / 100;
      console.log('🎫 Discount from session total_details:', discountAmount);
    }

    // Calculate discount percentage
    if (originalAmount > 0 && discountAmount > 0) {
      discountPercentage = Math.round((discountAmount / originalAmount) * 100);
    }

    // If final amount is 0 but original amount has value, then discount is 100%
    if (finalAmount === 0 && originalAmount > 0) {
      discountAmount = originalAmount;
      discountPercentage = 100;
      console.log('💯 100% discount detected - Final amount is 0');
    }

    console.log('💰 FINAL Payment Breakdown:', {
      originalAmount,
      discountAmount,
      finalAmount,
      discountPercentage: discountPercentage + '%',
      couponCode,
      hasInvoice: !!invoiceDetails
    });

    //  STEP 5: Deactivate existing subscriptions
    const deactivateResult = await query(
      'UPDATE supplier_subscription SET is_active = false WHERE user_id = $1',
      [user_id]
    );
    console.log('📊 Deactivated subscriptions:', deactivateResult.rowCount);

    //  STEP 6: Calculate dates - SAFE VERSION
    const startDate = new Date();
    let validEndDate = new Date();
    
    if (session.subscription) {
      // Recurring subscription - get end date from Stripe
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        if (subscription.current_period_end && !isNaN(subscription.current_period_end)) {
          validEndDate = new Date(subscription.current_period_end * 1000);
          console.log('📅 Subscription end date from Stripe:', validEndDate);
        } else {
          throw new Error('Invalid current_period_end from Stripe');
        }
      } catch (error) {
        console.error('❌ Error retrieving subscription:', error);
        // Fallback to plan duration
        const durationDays = parseInt(plan.duration_days) || 30;
        validEndDate = new Date();
        validEndDate.setDate(validEndDate.getDate() + durationDays);
        console.log('📅 Using fallback plan duration days:', durationDays);
      }
    } else {
      // One-time payment - use plan duration
      const durationDays = parseInt(plan.duration_days) || 30;
      validEndDate = new Date();
      validEndDate.setDate(validEndDate.getDate() + durationDays);
      console.log('📅 Using plan duration days:', durationDays);
    }

    //  Final validation of dates
    if (isNaN(validEndDate.getTime())) {
      console.error('❌ Invalid end date calculated, using 30 days default');
      validEndDate = new Date();
      validEndDate.setDate(validEndDate.getDate() + 30);
    }

    console.log(' Final dates - Start:', startDate, 'End:', validEndDate);

    //  STEP 7: Create new subscription in supplier_subscription WITH VALIDATED PLAN NAME
    const subscriptionResult = await query(
      `INSERT INTO supplier_subscription (
        user_id, plan_name, start_date, end_date, is_active, renewal_count,
        stripe_subscription_id, stripe_session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        user_id, 
        exactPlanNameForSubscription, //  DYNAMIC VALIDATED PLAN NAME
        startDate, 
        validEndDate,
        true, 
        0,
        session.subscription || null,
        session.id
      ]
    );
    console.log(' Subscription created with ID:', subscriptionResult.rows[0]?.id);

    //  STEP 8: Update user membership_plan
    const userUpdateResult = await query(
      'UPDATE users SET membership_plan = $1 WHERE id = $2 RETURNING id',
      [normalizedPlanNameForUser, user_id] //  Lowercase for users table
    );
    console.log('👤 User membership_plan updated:', userUpdateResult.rowCount);

    //  STEP 9: Create record in subscription_payments table WITH COUPON DETAILS
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
        finalAmount, // Final amount after discount
        session.currency?.toUpperCase() || 'USD',
        'completed',
        'card',
        startDate,
        validEndDate,
        originalAmount, // Original plan price
        discountAmount, // Discount amount
        finalAmount,    // Final paid amount
        discountPercentage, // Discount percentage
        couponCode,     // Coupon code used
        invoiceDetails?.number || session.invoice_number || `INV-${Date.now()}` // Invoice number
      ]
    );
    console.log('💰 Subscription payment recorded with coupon details');

    //  STEP 10: Create notification with discount info
    let notificationMessage = `Your ${exactPlanNameForSubscription} subscription has been activated!`;
    
    if (discountAmount > 0) {
      notificationMessage += ` You saved ${discountPercentage}% (${discountAmount})`;
      if (couponCode) {
        notificationMessage += ` with coupon ${couponCode}!`;
      } else {
        notificationMessage += ` with discount!`;
      }
    }

    await query(
      `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
      [user_id, 'subscription_activated', notificationMessage, 'pending']
    );

    //  STEP 11: Update webhook log to completed
    await query(
      'UPDATE webhook_logs SET status = $1 WHERE session_id = $2',
      ['completed', session.id]
    );

    console.log(` SUBSCRIPTION SUCCESS: User ${user_id}, Plan ${exactPlanNameForSubscription}`);
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
    
    //  Log error to webhook_errors table
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


//  SUBSCRIPTION CREATED
async function handleSubscriptionCreated(subscription: any) {
  console.log(`📝 Subscription created: ${subscription.id}`);
  console.log('📊 Subscription status:', subscription.status);
  
  try {
    // Update subscription status in database
    await query(
      'UPDATE supplier_subscription SET is_active = $1 WHERE stripe_subscription_id = $2',
      [subscription.status === 'active', subscription.id]
    );
    
    console.log(` Subscription ${subscription.id} status updated to: ${subscription.status}`);
  } catch (error) {
    console.error('❌ Error handling subscription created:', error);
  }
}

//  SUBSCRIPTION UPDATED
async function handleSubscriptionUpdated(subscription: any) {
  console.log(`🔄 Subscription updated: ${subscription.id}`);
  console.log('📊 New status:', subscription.status);
  
  try {
    //  SAFE: Calculate end date
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

    console.log(` Subscription updated: ${subscription.id}`);
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
  }
}

//  SUBSCRIPTION DELETED/CANCELED
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
        ['basic', userId]
      );

      // Create notification
      await query(
        `INSERT INTO notification_queue (user_id, type, message, status) VALUES ($1, $2, $3, $4)`,
        [userId, 'subscription_canceled', 'Your subscription has been canceled', 'pending']
      );

      console.log(` Subscription deactivated for user: ${userId}`);
    }
  } catch (error) {
    console.error('❌ Error handling subscription deletion:', error);
  }
}

//  SUBSCRIPTION: Recurring Payment Succeeded
async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log(`💰 Recurring payment succeeded: ${invoice.id}`);
  console.log('💳 Amount paid:', invoice.amount_paid / 100);
  
  try {
    if (invoice.subscription) {
      //  SAFE: Calculate new end date
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

      console.log(` Subscription renewed: ${invoice.subscription}`);
    }
  } catch (error) {
    console.error('❌ Error handling invoice payment:', error);
  }
}

//  SUBSCRIPTION: Recurring Payment Failed
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

//  GET method for testing
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