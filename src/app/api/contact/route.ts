import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendMail } from '@/lib/mailService';

// ✅ Advanced sanitization function
const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    // HTML tags remove karo
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<input\b[^<]*>/gi, '')
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
    // Dangerous characters escape karo
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#96;')
    .replace(/\$/g, '&#36;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;')
    .replace(/\(/g, '&#40;')
    .replace(/\)/g, '&#41;')
    .replace(/\[/g, '&#91;')
    .replace(/\]/g, '&#93;')
    // Multiple spaces reduce karo
    .replace(/\s+/g, ' ')
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '');
};

// ✅ Input length validation
const validateLength = (field: string, value: string, min: number, max: number): string | null => {
  if (value.length < min) {
    return `${field} must be at least ${min} characters`;
  }
  if (value.length > max) {
    return `${field} must be less than ${max} characters`;
  }
  return null;
};

// ✅ Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

// ✅ Phone validation
const isValidPhone = (phone: string | null): boolean => {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[\d\s\-()+.\s]{10,20}$/;
  return phoneRegex.test(phone);
};

// ✅ Type validation
const isValidType = (type: string): boolean => {
  const validTypes = ['general', 'parts', 'seller', 'technical', 'billing'];
  return validTypes.includes(type);
};

// ✅ Rate limiting simulation (production mei proper rate limiting use karna)
const isRateLimited = (request: NextRequest): boolean => {
  // Yaha tum proper rate limiting implement kar sakte ho
  // Jaise: Upstash Redis, etc.
  return false;
};

export async function POST(request: NextRequest) {
  try {
    // ✅ Rate limiting check
    if (isRateLimited(request)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // ✅ Request body parse karo safely
    let body;
    try {
      const text = await request.text();
      if (!text) {
        return NextResponse.json(
          { success: false, error: 'Request body is empty' },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // ✅ Extract and sanitize ALL fields
    const rawName = body.name || '';
    const rawEmail = body.email || '';
    const rawPhone = body.phone || null;
    const rawSubject = body.subject || '';
    const rawMessage = body.message || '';
    const rawType = body.type || 'general';

    // ✅ Deep sanitization
    const sanitizedData = {
      name: sanitizeInput(rawName),
      email: sanitizeInput(rawEmail).toLowerCase().trim(),
      phone: rawPhone ? sanitizeInput(rawPhone) : null,
      subject: sanitizeInput(rawSubject),
      message: sanitizeInput(rawMessage),
      type: sanitizeInput(rawType)
    };

    const { name, email, phone, subject, message, type } = sanitizedData;

    // ✅ Comprehensive validation
    const validationErrors: string[] = [];

    // Name validation
    if (!name) {
      validationErrors.push('Name is required');
    } else {
      const nameError = validateLength('Name', name, 2, 100);
      if (nameError) validationErrors.push(nameError);
    }

    // Email validation
    if (!email) {
      validationErrors.push('Email is required');
    } else if (!isValidEmail(email)) {
      validationErrors.push('Please provide a valid email address');
    }

    // Phone validation
    if (!isValidPhone(phone)) {
      validationErrors.push('Please provide a valid phone number');
    }

    // Subject validation
    if (!subject) {
      validationErrors.push('Subject is required');
    } else {
      const subjectError = validateLength('Subject', subject, 5, 200);
      if (subjectError) validationErrors.push(subjectError);
    }

    // Message validation
    if (!message) {
      validationErrors.push('Message is required');
    } else {
      const messageError = validateLength('Message', message, 10, 2000);
      if (messageError) validationErrors.push(messageError);
    }

    // Type validation
    if (!isValidType(type)) {
      validationErrors.push('Invalid inquiry type');
    }

    // ✅ Return all validation errors at once
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please fix the following errors:',
          details: validationErrors 
        },
        { status: 400 }
      );
    }

    // ✅ Database insertion with sanitized data
    const contactResult = await query(
      `INSERT INTO contact_messages (
        name, email, phone, subject, message, type, status, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        name, 
        email, 
        phone, 
        subject, 
        message, 
        type, 
        'new',
        request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      ]
    );

    const contactMessage = contactResult.rows[0];

    // ✅ Background email processing (non-blocking)
    const emailPromises = [
      sendUserConfirmationEmail(name, email, subject, message, type),
      sendAdminNotificationEmail(name, email, phone, subject, message, type)
    ].map(promise => 
      promise.catch(error => {
        console.error('Email sending failed:', error);
        return null; // Don't let email failures break the main flow
      })
    );

    // ✅ Don't wait for emails - respond immediately
    Promise.allSettled(emailPromises)
      .then((results) => {
        const failedEmails = results.filter(result => result.status === 'rejected');
        if (failedEmails.length > 0) {
          console.warn(`Some emails failed to send: ${failedEmails.length}`);
        } else {
          console.log('All emails sent successfully');
        }
      });

    console.log('Contact form submitted successfully:', {
      id: contactMessage.id,
      email: email.substring(0, 3) + '***', // Partial email for logs
      type: type,
      timestamp: new Date().toISOString()
    });

    // ✅ Success response
    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you within 24 hours.',
      data: {
        id: contactMessage.id,
        timestamp: contactMessage.created_at,
        caseId: `CASE-${contactMessage.id.toString().padStart(6, '0')}`
      }
    });

  } catch (error: any) {
    // ✅ Secure error logging
    console.error('🔥 Contact form submission error:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : 'hidden',
      timestamp: new Date().toISOString()
    });

    // ✅ Don't expose internal errors in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Server error: ${error.message}`
      : 'Failed to send message. Please try again or contact us directly.';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

// ✅ User Confirmation Email Template (Sanitized version)
async function sendUserConfirmationEmail(
  userName: string,
  userEmail: string,
  subject: string,
  message: string,
  type: string
) {
  // ✅ Email content ko bhi sanitize karo for display
  const safeName = userName;
  const safeEmail = userEmail;
  const safeSubject = subject;
  const safeMessage = message.replace(/\n/g, '<br>').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
      <p>Hello <strong>${safeName}</strong>,</p>
      
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
          <span class="detail-value">${safeName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${safeEmail}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Inquiry Type:</span>
          <span class="detail-value">${inquiryType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Subject:</span>
          <span class="detail-value">${safeSubject}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Message:</span>
          <span class="detail-value">${safeMessage}</span>
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
      to: safeEmail,
      subject: `✅ Message Received - PartsFinda Contact Confirmation`,
      html: emailHtml,
    });
    console.log(`✅ User confirmation email sent to ${safeEmail}`);
  } catch (error) {
    console.error('❌ Failed to send user confirmation email:', error);
    throw error;
  }
}

// ✅ Admin Notification Email Template (Sanitized version)
async function sendAdminNotificationEmail(
  userName: string,
  userEmail: string,
  userPhone: string | null,
  subject: string,
  message: string,
  type: string
) {
  // ✅ Sanitize admin email content
  const safeName = userName;
  const safeEmail = userEmail;
  const safePhone = userPhone || 'Not provided';
  const safeSubject = subject;
  const safeMessage = message.replace(/\n/g, '<br>').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
    ? process.env.ADMIN_EMAIL.split(',').map(email => email.trim()).filter(email => isValidEmail(email))
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
          <span class="detail-value" style="color: #2563eb; font-weight: 600;">${safeName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email Address:</span>
          <span class="detail-value">${safeEmail}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone Number:</span>
          <span class="detail-value">${safePhone}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Inquiry Type:</span>
          <span class="detail-value" style="color: #dc2626; font-weight: 600;">${inquiryType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Subject:</span>
          <span class="detail-value"><strong>${safeSubject}</strong></span>
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
        <p style="margin: 0; color: #4b5563; line-height: 1.6;">${safeMessage}</p>
      </div>

      <div class="action-buttons">
        <a href="mailto:${safeEmail}" class="button" style="background: #2563eb;">
          📧 Reply to Customer
        </a>
        <a href="tel:${safePhone !== 'Not provided' ? safePhone : '1-876-219-3329'}" class="button" style="background: #059669;">
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
        subject: `📨 New ${inquiryType} - ${safeName} (${safeEmail})`,
        html: emailHtml,
      })
    );

    await Promise.all(emailPromises);
    console.log(`✅ Admin notification emails sent to: ${adminEmails.join(', ')}`);
  } catch (error) {
    console.error('❌ Failed to send admin notification emails:', error);
    throw error;
  }
}

// ✅ GET endpoint to fetch contact messages (for admin panel) - Sanitized
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get('status') || 'all';
    const rawLimit = searchParams.get('limit') || '50';
    
    // ✅ Sanitize and validate parameters
    const status = sanitizeInput(rawStatus);
    const limit = parseInt(sanitizeInput(rawLimit)) || 50;
    
    // ✅ Validate status parameter
    const validStatuses = ['all', 'new', 'read', 'replied', 'closed'];
    const safeStatus = validStatuses.includes(status) ? status : 'all';
    
    // ✅ Validate limit parameter
    const safeLimit = Math.min(Math.max(1, limit), 100); // 1-100 range
    
    let queryString = `
      SELECT id, name, email, subject, type, status, created_at 
      FROM contact_messages
    `;
    let queryParams = [];
    
    if (safeStatus !== 'all') {
      queryString += ' WHERE status = $1';
      queryParams.push(safeStatus);
    }
    
    queryString += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1);
    queryParams.push(safeLimit);
    
    const result = await query(queryString, queryParams);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      limit: safeLimit,
      status: safeStatus
    });
    
  } catch (error: any) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch contact messages',
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message
        })
      },
      { status: 500 }
    );
  }
}