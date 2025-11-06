import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendMail } from '@/lib/mailService';
import { rateLimit } from "@/lib/rateLimit";

// ✅ Rate limiting storage
const submissionCounts = new Map<string, { count: number; lastSubmission: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message, type, website } = body; // Added website for honeypot
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

    console.log('🔍 Contact form submission:', { name, email, subject, clientIP });

    // ✅ 1. HONEYPOT CHECK - Agar website field bhara hai toh spam hai
    if (website && website !== '') {
      console.log('🚫 Honeypot triggered - spam detected');
      return NextResponse.json(
        { success: false, error: 'Message sent successfully!' }, // Don't reveal it's spam
        { status: 200 }
      );
    }

// ✅ Global Rate Limiting - ADNAN
const allowed = await rateLimit(clientIP, 5, 60 * 60); // 5 req/hour

if (!allowed) {
  return NextResponse.json(
    { success: false, error: "Too many submissions. Please try again later." },
    { status: 429 }
  );
}
    // ✅ 3. BASIC VALIDATION
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // ✅ 4. SPAM DETECTION
    const spamCheck = detectSpam({ name, email, subject, message, phone });
    if (spamCheck.isSpam) {
      console.log('🚫 Spam detected:', spamCheck.reason);
      return NextResponse.json(
        { success: false, error: 'Invalid form submission detected.' },
        { status: 400 }
      );
    }

    // ✅ 5. EMAIL VALIDATION
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // ✅ 6. CONTENT VALIDATION
    if (!isValidContent(name) || !isValidContent(subject) || !isValidContent(message)) {
      return NextResponse.json(
        { success: false, error: 'Invalid content detected in form fields' },
        { status: 400 }
      );
    }

    // ✅ 7. Save contact message to database
    const contactResult = await query(
      `INSERT INTO contact_messages (
        name, email, phone, subject, message, type, status, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [name, email, phone || null, subject, message, type || 'general', 'new', clientIP]
    );

    const contactMessage = contactResult.rows[0];

    // ✅ 8. Send confirmation email to user
    await sendUserConfirmationEmail(name, email, subject, message, type);

    // ✅ 9. Send notification email to admin
    await sendAdminNotificationEmail(name, email, phone, subject, message, type);

    console.log('✅ Contact form submitted successfully:', contactMessage.id);

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you within 24 hours.',
      data: {
        id: contactMessage.id,
        timestamp: contactMessage.created_at
      }
    });

  } catch (error: any) {
    console.error('🔥 Contact form submission error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send message. Please try again or contact us directly.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ✅ SPAM DETECTION FUNCTION
function detectSpam(data: { name: string; email: string; subject: string; message: string; phone?: string }) {
  const { name, email, subject, message, phone } = data;

  // Check for random strings (like lBCvfehJZzJHdOPUldUQrxS)
  if (isRandomString(name) || isRandomString(subject) || isRandomString(message)) {
    return { isSpam: true, reason: 'Random string detected' };
  }

  // Check for suspicious patterns
  if (name.length > 100 || subject.length > 200 || message.length > 5000) {
    return { isSpam: true, reason: 'Field length too long' };
  }

  // Check for too many special characters
  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g;
  const nameSpecialChars = (name.match(specialCharRegex) || []).length;
  if (nameSpecialChars > 5) {
    return { isSpam: true, reason: 'Too many special characters in name' };
  }

  // Check for common spam keywords
  const spamKeywords = ['casino', 'viagra', 'lottery', 'get rich', 'work from home', 'make money', 'investment'];
  const combinedText = `${subject} ${message}`.toLowerCase();
  if (spamKeywords.some(keyword => combinedText.includes(keyword))) {
    return { isSpam: true, reason: 'Spam keywords detected' };
  }

  // Check phone number (if provided)
  if (phone && !isValidPhone(phone)) {
    return { isSpam: true, reason: 'Invalid phone number' };
  }

  return { isSpam: false, reason: '' };
}

// ✅ RANDOM STRING DETECTION
function isRandomString(str: string): boolean {
  if (str.length < 8) return false;
  
  const letterRatio = (str.match(/[a-zA-Z]/g) || []).length / str.length;
  const hasMixedCase = /[a-z]/.test(str) && /[A-Z]/.test(str);
  const noSpaces = !/\s/.test(str);
  const noVowels = !/[aeiouAEIOU]/.test(str);
  const consecutiveConsonants = /[bcdfghjklmnpqrstvwxyz]{4,}/i.test(str);

  // If it has mixed case, no spaces, no vowels, and high letter ratio - likely random
  return letterRatio > 0.7 && hasMixedCase && noSpaces && (noVowels || consecutiveConsonants);
}

// ✅ CONTENT VALIDATION
function isValidContent(content: string): boolean {
  return content.trim().length >= 2 && 
         content.length <= 5000 && 
         /[a-zA-Z]/.test(content); // At least one letter
}

// ✅ PHONE VALIDATION
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}


// ✅ User Confirmation Email Template
async function sendUserConfirmationEmail(
  userName: string,
  userEmail: string,
  subject: string,
  message: string,
  type: string
) {
  const inquiryTypeLabels: { [key: string]: string } = {
    general: 'General Inquiry',
    parts: 'Parts Question',
    seller: 'Seller Support',
    technical: 'Technical Support',
    billing: 'Billing Question'
  };

  const inquiryType = inquiryTypeLabels[type] || 'General Inquiry';

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
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
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
    .confirmation-badge { 
      background: #f0f9ff; 
      border: 2px solid #2563eb;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .message-details { 
      background: #f8fafc; 
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      margin-bottom: 12px;
    }
    .detail-label {
      font-weight: 600;
      color: #374151;
      min-width: 120px;
    }
    .detail-value {
      color: #6b7280;
      flex: 1;
    }
    .response-time {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
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
      <h1>📧 Message Received</h1>
      <p>Thank you for contacting PartsFinda</p>
    </div>
    
    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      
      <p>Thank you for reaching out to PartsFinda! We have received your message and our team will get back to you as soon as possible.</p>

      <div class="confirmation-badge">
        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #2563eb;">
          ✅ Message Confirmation - Case #${Date.now().toString().slice(-6)}
        </p>
      </div>

      <div class="message-details">
        <h3 style="margin-top: 0; color: #374151;">Your Message Details:</h3>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${userName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${userEmail}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Inquiry Type:</span>
          <span class="detail-value">${inquiryType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Subject:</span>
          <span class="detail-value">${subject}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Message:</span>
          <span class="detail-value">${message}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Submitted:</span>
          <span class="detail-value">${new Date().toLocaleString('en-US', { 
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>

      <div class="response-time">
        <h4 style="margin: 0 0 10px 0; color: #065f46;">⏰ What to Expect Next</h4>
        <p style="margin: 0; color: #047857;">
          Our team typically responds within <strong>24 hours</strong> during business days. 
          For urgent matters, you can call us directly at <strong>1-876-219-3329</strong>.
        </p>
      </div>

      <p><strong>Need Immediate Assistance?</strong></p>
      <p>
        📞 <strong>Call Us:</strong> 1-876-219-3329<br>
        🕒 <strong>Business Hours:</strong> Mon-Fri 8:00 AM - 6:00 PM | Sat 9:00 AM - 4:00 PM
      </p>

      <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
        This is an automated confirmation. Please do not reply to this email.
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
      subject: `✅ Message Received - PartsFinda Contact Confirmation`,
      html: emailHtml,
    });
    console.log(`✅ User confirmation email sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Failed to send user confirmation email:', error);
  }
}

// ✅ Admin Notification Email Template
async function sendAdminNotificationEmail(
  userName: string,
  userEmail: string,
  userPhone: string | null,
  subject: string,
  message: string,
  type: string
) {
  const inquiryTypeLabels: { [key: string]: string } = {
    general: 'General Inquiry',
    parts: 'Parts Question',
    seller: 'Seller Support',
    technical: 'Technical Support',
    billing: 'Billing Question'
  };

  const inquiryType = inquiryTypeLabels[type] || 'General Inquiry';
  
  // ✅ Multiple admin emails support
  const adminEmails = process.env.ADMIN_EMAIL 
    ? process.env.ADMIN_EMAIL.split(',').map(email => email.trim())
    : ['admin@partsfinda.com', 'support@partsfinda.com'];

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
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
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
    .contact-details { 
      background: #f8fafc; 
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .detail-row {
      display: flex;
      margin-bottom: 10px;
    }
    .detail-label {
      font-weight: 600;
      color: #374151;
      min-width: 140px;
    }
    .detail-value {
      color: #6b7280;
      flex: 1;
    }
    .message-content {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 15px;
      margin: 15px 0;
      border-radius: 0 8px 8px 0;
    }
    .action-buttons {
      margin: 20px 0;
      text-align: center;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      margin: 0 10px;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
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
    .priority-general { background: #dbeafe; border-left: 4px solid #2563eb; }
    .priority-parts { background: #f0f9ff; border-left: 4px solid #0369a1; }
    .priority-seller { background: #f0fdf4; border-left: 4px solid #16a34a; }
    .priority-technical { background: #fef3c7; border-left: 4px solid #d97706; }
    .priority-billing { background: #fdf2f8; border-left: 4px solid #db2777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📨 New Contact Form Submission</h1>
      <p>PartsFinda Support Portal</p>
    </div>
    
    <div class="content">
      <div class="alert-badge">
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #dc2626;">
          🔔 New ${inquiryType} Received
        </p>
      </div>

      <p><strong>Hello Admin Team,</strong></p>
      
      <p>A new contact form submission has been received on PartsFinda that requires your attention.</p>

      <div class="contact-details">
        <h3 style="margin-top: 0; color: #374151;">Contact Information:</h3>
        <div class="detail-row">
          <span class="detail-label">Customer Name:</span>
          <span class="detail-value" style="color: #2563eb; font-weight: 600;">${userName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email Address:</span>
          <span class="detail-value">${userEmail}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone Number:</span>
          <span class="detail-value">${userPhone || 'Not provided'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Inquiry Type:</span>
          <span class="detail-value" style="color: #dc2626; font-weight: 600;">${inquiryType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Subject:</span>
          <span class="detail-value"><strong>${subject}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Submission Time:</span>
          <span class="detail-value">${new Date().toLocaleString('en-US', { 
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>

      <div class="message-content priority-${type}">
        <h4 style="margin: 0 0 10px 0; color: #374151;">📝 Customer Message:</h4>
        <p style="margin: 0; color: #4b5563; line-height: 1.6;">${message}</p>
      </div>

      <div class="action-buttons">
        <a href="mailto:${userEmail}" class="button" style="background: #2563eb;">
          📧 Reply to Customer
        </a>
        <a href="tel:${userPhone || '1-876-219-3329'}" class="button" style="background: #059669;">
          📞 Call Customer
        </a>
      </div>

      <p style="background: #f0f9ff; padding: 12px; border-radius: 6px; border-left: 4px solid #2563eb;">
        <strong>💡 Response Guidelines:</strong><br>
        • Please respond within <strong>24 hours</strong><br>
        • Use professional and helpful tone<br>
        • Escalate technical issues to the appropriate team
      </p>

      <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
        This is an automated notification from the PartsFinda contact system.
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
        subject: `📨 New ${inquiryType} - ${userName} (${userEmail})`,
        html: emailHtml,
      })
    );

    await Promise.all(emailPromises);
    console.log(`✅ Admin notification emails sent to: ${adminEmails.join(', ')}`);
  } catch (error) {
    console.error('❌ Failed to send admin notification emails:', error);
  }
}

// Optional: GET endpoint to fetch contact messages (for admin panel)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    
    let queryString = 'SELECT * FROM contact_messages';
    let queryParams = [];
    
    if (status !== 'all') {
      queryString += ' WHERE status = $1';
      queryParams.push(status);
    }
    
    queryString += ' ORDER BY created_at DESC LIMIT 50';
    
    const result = await query(queryString, queryParams);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
    
  } catch (error: any) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact messages' },
      { status: 500 }
    );
  }
}