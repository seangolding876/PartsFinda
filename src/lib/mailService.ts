// src/lib/mailService.ts - GODADDY VERSION
import nodemailer from "nodemailer";

export async function sendMail({ 
  to, 
  subject, 
  html 
}: { 
  to: string; 
  subject: string; 
  html: string; 
}) {
  try {
    console.log('🔍 GoDaddy SMTP Configuration Check:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      secure: process.env.SMTP_SECURE
    });

    // Validate required environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('GoDaddy SMTP configuration is missing');
    }

    // GoDaddy Specific Transporter Configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // smtpout.secureserver.net
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // ❌ MUST BE false for GoDaddy port 587
      auth: {
        user: process.env.SMTP_USER, // support@partsfinda.com
        pass: process.env.SMTP_PASS, // Partsfinda@123
      },
      // GoDaddy specific settings
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      debug: true,
      logger: true
    });

    console.log('🔄 Verifying GoDaddy SMTP connection...');

    // Verify connection
    await transporter.verify();
    console.log('✅ GoDaddy SMTP connection verified');

    // Use SMTP_FROM or fallback to SMTP_USER
    const fromAddress = process.env.SMTP_FROM || `"PartsFinda Support" <${process.env.SMTP_USER}>`;

    const mailOptions = {
      from: fromAddress,
      to: to,
      subject: subject,
      html: html,
      text: html.replace(/<[^>]*>/g, ''), // HTML to text
    };

    console.log('📤 Sending via GoDaddy:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);

    // Detailed success logs
    console.log("🎉 GODADDY EMAIL SENT SUCCESSFULLY:", {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted, // This should show the recipient
      rejected: info.rejected, // This should be empty
      envelope: info.envelope
    });

    return { 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response 
    };

  } catch (error: any) {
    console.error("💥 GODADDY EMAIL FAILED:", {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    throw new Error(`GoDaddy email failed: ${error.message}`);
  }
}