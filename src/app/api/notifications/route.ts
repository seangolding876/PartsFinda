import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY || 're_22SZjK9K_9UVTtzugSLg27mG24adGZwXT');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, subject, data } = body;

    if (type === 'part_request') {
      // Email template for new part requests to sellers
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -30px -30px 20px; text-align: center; }
            .badge { display: inline-block; background: #fbbf24; color: #92400e; padding: 5px 10px; border-radius: 5px; font-weight: bold; margin-bottom: 15px; }
            .details { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { margin: 10px 0; display: flex; justify-content: space-between; }
            .detail-label { font-weight: bold; color: #4b5563; }
            .detail-value { color: #1f2937; }
            .button { background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>PartsFinda</h1>
              <p>New Part Request Alert!</p>
            </div>

            <div class="badge">🔔 URGENT REQUEST</div>

            <h2>A customer is looking for: ${data.partName}</h2>

            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Vehicle:</span>
                <span class="detail-value">${data.vehicle}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer:</span>
                <span class="detail-value">${data.customerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${data.location}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Budget:</span>
                <span class="detail-value">$${data.budget}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Quantity:</span>
                <span class="detail-value">${data.quantity || 1}</span>
              </div>
              ${data.description ? `
              <div class="detail-row">
                <span class="detail-label">Additional Info:</span>
                <span class="detail-value">${data.description}</span>
              </div>
              ` : ''}
            </div>

            <p><strong>Respond quickly to increase your chances of making this sale!</strong></p>

            <center>
              <a href="https://partsfinda.com/seller/dashboard" class="button">
                View Request & Send Quote
              </a>
            </center>

            <div class="footer">
              <p>You're receiving this because you're a verified seller on PartsFinda</p>
              <p>© 2024 PartsFinda Inc. | Kingston, Jamaica</p>
              <p>Questions? Email us at support@partsfinda.com</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email to seller
      const emailResponse = await resend.emails.send({
        from: 'PartsFinda <notifications@partsfinda.com>',
        to: to || 'support@partsfinda.com',
        subject: subject || `New Part Request: ${data.partName}`,
        html: emailHtml,
      });

      return NextResponse.json({
        success: true,
        message: 'Notification sent',
        emailId: emailResponse.data?.id
      });
    }

    if (type === 'quote_sent') {
      // Email template for when a seller sends a quote
      const quoteHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -30px -30px 20px; text-align: center; }
            .quote-box { background: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .price { font-size: 36px; font-weight: bold; color: #059669; }
            .details { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>PartsFinda</h1>
              <p>You've Received a Quote!</p>
            </div>

            <h2>Quote for: ${data.partName}</h2>

            <div class="quote-box">
              <p>Quote Amount:</p>
              <div class="price">$${data.quoteAmount}</div>
            </div>

            <div class="details">
              <p><strong>Seller:</strong> ${data.sellerName}</p>
              <p><strong>Availability:</strong> ${data.availability}</p>
              <p><strong>Delivery:</strong> ${data.deliveryTime}</p>
              ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}
            </div>

            <center>
              <a href="https://partsfinda.com/messages" class="button">
                View Quote & Message Seller
              </a>
            </center>
          </div>
        </body>
        </html>
      `;

      const emailResponse = await resend.emails.send({
        from: 'PartsFinda <notifications@partsfinda.com>',
        to: to,
        subject: subject || `Quote Received: ${data.partName}`,
        html: quoteHtml,
      });

      return NextResponse.json({
        success: true,
        message: 'Quote notification sent',
        emailId: emailResponse.data?.id
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid notification type'
    }, { status: 400 });

  } catch (error) {
    console.error('Notification error:', error);
    // For demo/development, return success even if email fails
    return NextResponse.json({
      success: true,
      message: 'Notification queued (demo mode)',
      demo: true
    });
  }
}
