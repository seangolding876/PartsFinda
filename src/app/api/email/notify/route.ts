// app/api/email/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { query } from '@/lib/db';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { type, userId, data } = await request.json();

    // Get user email
    const userResult = await query(
      'SELECT email, name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' });
    }

    const user = userResult.rows[0];

    let emailSubject = '';
    let emailHtml = '';

    switch (type) {
      case 'new_quote':
        emailSubject = `New Quote Received for ${data.partName}`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Quote Received! 🎉</h2>
            <p>Hello ${user.name},</p>
            <p>You have received a new quote for your part request:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.partName}</h3>
              <p style="margin: 5px 0;"><strong>Seller:</strong> ${data.sellerName}</p>
              <p style="margin: 5px 0;"><strong>Price:</strong> J$${data.price}</p>
              <p style="margin: 5px 0;"><strong>Delivery:</strong> ${data.deliveryTime}</p>
            </div>
            <a href="https://yourapp.com/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Quote
            </a>
          </div>
        `;
        break;

      case 'quote_accepted':
        emailSubject = `Your Quote Has Been Accepted!`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Quote Accepted! ✅</h2>
            <p>Hello ${user.name},</p>
            <p>Great news! A buyer has accepted your quote:</p>
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.partName}</h3>
              <p style="margin: 5px 0;"><strong>Price:</strong> J$${data.price}</p>
              <p style="margin: 5px 0;"><strong>Buyer:</strong> ${data.buyerName}</p>
            </div>
            <p>Please contact the buyer to arrange delivery/pickup.</p>
          </div>
        `;
        break;

      case 'new_message':
        emailSubject = `New Message from ${data.senderName}`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">New Message 💬</h2>
            <p>Hello ${user.name},</p>
            <p>You have received a new message regarding:</p>
            <div style="background: #faf5ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;"><strong>${data.partName}</strong></p>
              <p style="margin: 10px 0 0 0; font-style: italic;">"${data.messagePreview}"</p>
            </div>
            <a href="https://yourapp.com/messages" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Message
            </a>
          </div>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: 'PartsFinda <notifications@partsfinda.com>',
      to: user.email,
      subject: emailSubject,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      emailId: emailResponse.data?.id
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send email'
    }, { status: 500 });
  }
}