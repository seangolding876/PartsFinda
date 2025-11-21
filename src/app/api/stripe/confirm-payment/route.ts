import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { sendMail } from '@/lib/mailService'; // ✅ Email service import

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = verifyToken(token);

    const body = await request.json();
    const { paymentIntentId, planId } = body;

    if (!paymentIntentId || !planId) {
      return NextResponse.json(
        { success: false, error: 'Payment intent ID and plan ID are required' },
        { status: 400 }
      );
    }

    console.log('Verifying payment for intent:', paymentIntentId);

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log('Stripe PaymentIntent:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      currency: paymentIntent.currency,
    });

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { success: false, error: `Payment not completed (status: ${paymentIntent.status})` },
        { status: 400 }
      );
    }

    // Fetch plan details - make sure plan_name matches the constraint
    const planResult = await query('SELECT * FROM subscription_plans WHERE plan_id = $1', [planId]);
    if (planResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid plan ID' }, { status: 400 });
    }

    const plan = planResult.rows[0];

    // ✅ Validate plan name against allowed values
    const allowedPlans = ['Basic', 'Premium', 'Enterprise'];
    if (!allowedPlans.includes(plan.plan_name)) {
      console.error('Invalid plan name:', plan.plan_name);
      return NextResponse.json(
        { success: false, error: 'Invalid subscription plan' },
        { status: 400 }
      );
    }

    console.log('Activating plan:', plan.plan_name);

    // Get user details for email
    const userResult = await query('SELECT email, name FROM users WHERE id = $1', [userInfo.userId]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Update payment status
    await query('UPDATE payments SET status = $1 WHERE stripe_payment_id = $2', ['completed', paymentIntentId]);

    // Deactivate any active subscriptions for this user
    await query('UPDATE supplier_subscription SET is_active = false WHERE user_id = $1', [userInfo.userId]);

    // Subscription date calculations
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Create new subscription
    const subscriptionResult = await query(
      `INSERT INTO supplier_subscription (
        user_id, plan_name, start_date, end_date, is_active, renewal_count
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [userInfo.userId, plan.plan_name, startDate, endDate, true, 0]
    );

    // Update user's plan
    await query('UPDATE users SET membership_plan = $1 WHERE id = $2', [plan.plan_name, userInfo.userId]);

    // Create notification
    await query(
      `INSERT INTO notification_queue (user_id, type, message, status)
       VALUES ($1, $2, $3, $4)`,
      [
        userInfo.userId,
        'subscription_activated',
        `Your ${plan.plan_name} subscription has been activated successfully!`,
        'pending',
      ]
    );

    // ✅ Send subscription success email to user
    await sendSubscriptionSuccessEmail(user.email, user.name, plan.plan_name, endDate, paymentIntent.amount);

    // ✅ Send admin notification email
    await sendAdminNotificationEmail(user.email, user.name, plan.plan_name, paymentIntent.amount);

    console.log('Subscription created:', subscriptionResult.rows[0]);

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully!',
      data: subscriptionResult.rows[0],
    });
  } catch (error: any) {
    console.error('🔥 Payment confirmation error:', error);

    // Enhanced diagnostic logging
    const isStripeError = error?.type?.startsWith('Stripe');
    const isDatabaseError = error?.message?.includes('syntax') || error?.message?.includes('constraint');

    if (isStripeError) {
      console.error('Stripe Error Details:', {
        type: error.type,
        code: error.code,
        message: error.message,
        raw: error.raw,
      });
    }

    if (isDatabaseError) {
      console.error('Database Error Details:', error.message);
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred during payment confirmation',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// ✅ Subscription Success Email Template (User)
async function sendSubscriptionSuccessEmail(
  userEmail: string, 
  userName: string, 
  planName: string, 
  endDate: Date, 
  amount: number
) {
  const formattedAmount = (amount / 100).toFixed(2); // Convert cents to dollars
  const formattedEndDate = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: #f3f4f6;
      margin: 0;
      padding: 40px 20px;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 10px; 
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); 
      color: white; 
      padding: 30px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 24px; 
      font-weight: 700;
    }
    .content { 
      padding: 30px; 
      color: #374151;
    }
    .success-badge { 
      background: #f0f9ff; 
      border: 2px solid #7c3aed;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .plan-details { 
      background: #f8fafc; 
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    .button { 
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 6px; 
      display: inline-block; 
      margin: 15px 0; 
      font-weight: 600;
    }
    .footer { 
      text-align: center; 
      color: #6b7280; 
      font-size: 12px; 
      margin-top: 20px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb; 
    }
    .features-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      margin: 20px 0;
    }
    .feature {
      background: #f0f9ff;
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid #7c3aed;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Subscription Activated Successfully!</h1>
      <p>Welcome to ${planName} Plan</p>
    </div>
    
    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      
      <p>Thank you for purchasing the <strong>${planName}</strong> subscription! Your payment has been processed successfully and your seller account has been upgraded.</p>

      <div class="success-badge">
        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #7c3aed;">
          ✅ Payment Confirmed - ${planName} Plan Activated
        </p>
      </div>

      <div class="plan-details">
        <h3 style="margin-top: 0; color: #374151;">Subscription Details:</h3>
        <div class="detail-row">
          <span><strong>Plan Name:</strong></span>
          <span style="color: #7c3aed; font-weight: 600;">${planName}</span>
        </div>
        <div class="detail-row">
          <span><strong>Amount Paid:</strong></span>
          <span style="color: #059669; font-weight: 600;">$${formattedAmount}</span>
        </div>
        <div class="detail-row">
          <span><strong>Subscription Ends:</strong></span>
          <span style="color: #374151; font-weight: 500;">${formattedEndDate}</span>
        </div>
        <div class="detail-row">
          <span><strong>Status:</strong></span>
          <span style="color: #059669; font-weight: 600;">Active ✅</span>
        </div>
      </div>

      <div class="features-grid">
        <div class="feature">
          <strong>🚀 Enhanced Visibility</strong>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Your listings will appear higher in search results</p>
        </div>
        <div class="feature">
          <strong>📊 Advanced Analytics</strong>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Access detailed performance insights for your parts</p>
        </div>
        <div class="feature">
          <strong>💬 Priority Support</strong>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Get faster responses from our support team</p>
        </div>
      </div>

      <p><strong>What's Next?</strong></p>
      <p>You can now enjoy all the premium features of your ${planName} plan. Start listing more parts and grow your business!</p>

      <center>
        <a href="${process.env.NEXTAUTH_URL}/seller/dashboard" class="button" style="background: #7c3aed; color: #ffffff !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; font-weight: 600; font-size: 16px; border: none; cursor: pointer; text-align: center;">
          Go to Seller Dashboard
        </a>
      </center>

      <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
        Need help? <a href="${process.env.NEXTAUTH_URL}/contact" style="color: #7c3aed;">Contact our support team</a>
      </p>
    </div>

    <div class="footer">
      <p>Thank you for choosing PartsFinda - Jamaica's premier auto parts marketplace!</p>
      <p>© 2025 PartsFinda Inc. | Auto Parts Marketplace</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendMail({
      to: userEmail,
      subject: `🎉 Welcome to ${planName} Plan - PartsFinda Subscription Activated!`,
      html: emailHtml,
    });
    console.log(`✅ Subscription success email sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Failed to send subscription success email:', error);
    // Don't throw error - email failure shouldn't break the payment flow
  }
}

// ✅ Admin Notification Email Template
// ✅ Admin Notification Email Template
async function sendAdminNotificationEmail(
  userEmail: string, 
  userName: string, 
  planName: string, 
  amount: number
) {
  const formattedAmount = (amount / 100).toFixed(2);
  
  // ✅ Multiple admin emails support
  const adminEmails = process.env.ADMIN_EMAIL 
    ? process.env.ADMIN_EMAIL.split(',').map(email => email.trim())
    : ['admin@partsfinda.com']; // Fallback

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: #f3f4f6;
      margin: 0;
      padding: 20px;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 10px; 
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #059669 0%, #047857 100%); 
      color: white; 
      padding: 25px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 22px; 
      font-weight: 700;
    }
    .content { 
      padding: 25px; 
      color: #374151;
    }
    .alert-badge { 
      background: #fef3c7; 
      border: 2px solid #d97706;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      margin: 15px 0;
    }
    .transaction-details { 
      background: #f8fafc; 
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    .footer { 
      text-align: center; 
      color: #6b7280; 
      font-size: 12px; 
      margin-top: 20px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📈 New Subscription Purchase</h1>
      <p>PartsFinda Seller Subscription</p>
    </div>
    
    <div class="content">
      <div class="alert-badge">
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #d97706;">
          🎯 New Premium Subscription Activated
        </p>
      </div>

      <p><strong>Hello Admin Team,</strong></p>
      
      <p>A new subscription has been successfully purchased on PartsFinda.</p>

      <div class="transaction-details">
        <h3 style="margin-top: 0; color: #374151;">Transaction Details:</h3>
        <div class="detail-row">
          <span><strong>Seller Name:</strong></span>
          <span style="color: #7c3aed; font-weight: 600;">${userName}</span>
        </div>
        <div class="detail-row">
          <span><strong>Seller Email:</strong></span>
          <span style="color: #374151; font-weight: 500;">${userEmail}</span>
        </div>
        <div class="detail-row">
          <span><strong>Plan Purchased:</strong></span>
          <span style="color: #059669; font-weight: 600;">${planName}</span>
        </div>
        <div class="detail-row">
          <span><strong>Amount:</strong></span>
          <span style="color: #059669; font-weight: 600;">$${formattedAmount}</span>
        </div>
        <div class="detail-row">
          <span><strong>Purchase Time:</strong></span>
          <span style="color: #374151; font-weight: 500;">${new Date().toLocaleString('en-US', { 
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          })}</span>
        </div>
      </div>

      <p style="background: #f0f9ff; padding: 12px; border-radius: 6px; border-left: 4px solid #7c3aed;">
        <strong>💡 Action Required:</strong> 
        This is an automated notification. No immediate action is required. The subscription has been automatically activated in the system.
      </p>

      <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
        You can view seller details in the admin panel.
      </p>
    </div>

    <div class="footer">
      <p>PartsFinda Admin System | Auto Parts Marketplace</p>
      <p>© 2025 PartsFinda Inc.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    // ✅ Send email to all admin addresses
    const emailPromises = adminEmails.map(adminEmail => 
      sendMail({
        to: adminEmail,
        subject: `📈 New ${planName} Subscription - ${userName} (${userEmail})`,
        html: emailHtml,
      })
    );

    await Promise.all(emailPromises);
    console.log(`✅ Admin notification emails sent to: ${adminEmails.join(', ')}`);
  } catch (error) {
    console.error('❌ Failed to send admin notification emails:', error);
    // Don't throw error - email failure shouldn't break the payment flow
  }
}