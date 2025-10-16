// app/api/email/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendMail } from '@/lib/mailService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { type, userId, data } = await request.json();

    console.log('📧 Email notification request:', { type, userId, data });

    // Get user email
    const userResult = await query(
      'SELECT email, name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const user = userResult.rows[0];
    console.log('👤 Found user:', user.email);

    let emailSubject = '';
    let emailHtml = '';

    switch (type) {
      case 'new_quote':
        emailSubject = `New Quote Received for ${data.partName}`;
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -30px -30px 20px; text-align: center; }
              .badge { display: inline-block; background: #fbbf24; color: #92400e; padding: 5px 10px; border-radius: 5px; font-weight: bold; margin-bottom: 15px; }
              .details { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { margin: 10px 0; display: flex; justify-content: space-between; }
              .detail-label { font-weight: bold; color: #4b5563; }
              .detail-value { color: #1f2937; }
              .button { background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>PartsFinda</h1>
                <p>New Quote Received! 🎉</p>
              </div>

              <div class="badge">NEW QUOTE</div>

              <p>Hello <strong>${user.name}</strong>,</p>
              <p>You have received a new quote for your part request:</p>

              <div class="details">
                <h3 style="margin: 0 0 15px 0; color: #1f2937;">${data.partName}</h3>
                <div class="detail-row">
                  <span class="detail-label">Seller:</span>
                  <span class="detail-value">${data.sellerName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Price:</span>
                  <span class="detail-value" style="color: #059669; font-weight: bold;">J$${data.price}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Delivery Time:</span>
                  <span class="detail-value">${data.deliveryTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Condition:</span>
                  <span class="detail-value">${data.condition || 'Not specified'}</span>
                </div>
                ${data.notes ? `
                <div class="detail-row">
                  <span class="detail-label">Seller Notes:</span>
                  <span class="detail-value">${data.notes}</span>
                </div>
                ` : ''}
              </div>

              <p><strong>Respond quickly to secure this part!</strong></p>

              <center>
                <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">
                  View Quote & Respond
                </a>
              </center>

              <div class="footer">
                <p>You're receiving this because you're a registered user on PartsFinda</p>
                <p>© 2024 PartsFinda Inc. | Auto Parts Marketplace</p>
                <p>Questions? Email us at support@partsfinda.com</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'quote_accepted':
        emailSubject = `Your Quote Has Been Accepted!`;
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
              .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -30px -30px 20px; text-align: center; }
              .success-box { background: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
              .price { font-size: 36px; font-weight: bold; color: #059669; }
              .details { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .button { background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>PartsFinda</h1>
                <p>Quote Accepted! ✅</p>
              </div>

              <div class="success-box">
                <p style="font-size: 18px; margin: 0 0 10px 0;">Congratulations!</p>
                <div class="price">J$${data.price}</div>
                <p style="margin: 10px 0 0 0;">Your quote has been accepted!</p>
              </div>

              <p>Hello <strong>${user.name}</strong>,</p>
              <p>Great news! A buyer has accepted your quote for the following part:</p>

              <div class="details">
                <h3 style="margin: 0 0 15px 0; color: #1f2937;">${data.partName}</h3>
                <div class="detail-row">
                  <span class="detail-label">Buyer:</span>
                  <span class="detail-value">${data.buyerName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Accepted Price:</span>
                  <span class="detail-value" style="color: #059669; font-weight: bold;">J$${data.price}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Vehicle:</span>
                  <span class="detail-value">${data.vehicle}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Request ID:</span>
                  <span class="detail-value">${data.requestId}</span>
                </div>
              </div>

              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Contact the buyer to arrange delivery/pickup</li>
                <li>Confirm payment details</li>
                <li>Update order status once completed</li>
              </ul>

              <center>
                <a href="${process.env.NEXTAUTH_URL}/messages" class="button">
                  Contact Buyer
                </a>
              </center>

              <div class="footer">
                <p>You're receiving this because you're a verified seller on PartsFinda</p>
                <p>© 2024 PartsFinda Inc. | Auto Parts Marketplace</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'new_message':
        emailSubject = `New Message from ${data.senderName}`;
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
              .header { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -30px -30px 20px; text-align: center; }
              .message-box { background: #faf5ff; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0; }
              .details { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .button { background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>PartsFinda</h1>
                <p>New Message 💬</p>
              </div>

              <p>Hello <strong>${user.name}</strong>,</p>
              <p>You have received a new message from <strong>${data.senderName}</strong> regarding:</p>

              <div class="details">
                <p style="margin: 0; font-weight: bold;">${data.partName}</p>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${data.vehicle}</p>
              </div>

              <div class="message-box">
                <p style="margin: 0; font-style: italic;">"${data.messagePreview}"</p>
              </div>

              <center>
                <a href="${process.env.NEXTAUTH_URL}/messages" class="button">
                  Reply to Message
                </a>
              </center>

              <div class="footer">
                <p>You're receiving this because you're participating in this conversation on PartsFinda</p>
                <p>© 2024 PartsFinda Inc. | Auto Parts Marketplace</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid notification type'
        }, { status: 400 });
    }

    // Use your existing mail service
    console.log('📨 Sending email via SMTP...');
    const mailResult = await sendMail({
      to: user.email,
      subject: emailSubject,
      html: emailHtml
    });

    console.log('✅ Email sent successfully:', mailResult);

    return NextResponse.json({
      success: true,
      messageId: mailResult.messageId,
      user: { email: user.email, name: user.name }
    });

  } catch (error: any) {
    console.error('❌ Error sending email notification:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send email notification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}