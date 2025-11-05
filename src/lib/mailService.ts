// src/lib/mailService.ts
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
    console.log('🔍 Checking SMTP Configuration...');
    
    // Validate required environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ Missing Environment Variables:');
      console.error('   SMTP_HOST:', process.env.SMTP_HOST);
      console.error('   SMTP_USER:', process.env.SMTP_USER);
      console.error('   SMTP_PASS:', process.env.SMTP_PASS ? '***' : 'NOT SET');
      throw new Error('SMTP configuration is missing. Please check your .env file');
    }

    console.log('✅ Environment variables found');

    // Create transporter with better configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // Important for local development
      },
      debug: true, // This will show detailed logs
      logger: true
    });

    console.log('🔄 Verifying SMTP connection...');

    // Verify connection with better error handling
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');

    const mailOptions = {
      from: `"PartsFinda" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: html.replace(/<[^>]*>/g, ''), // Proper HTML to text conversion
    };

    console.log('📤 Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);

    // **DETAILED SUCCESS LOGS**
    console.log("🎉 EMAIL SENT SUCCESSFULLY - DETAILS:", {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted, // This should contain the recipient email
      rejected: info.rejected, // This should be empty
      envelope: info.envelope,
      pending: info.pending
    });

    return { 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response 
    };

  } catch (error: any) {
    // **DETAILED ERROR LOGS**
    console.error("💥 EMAIL SENDING FAILED - DETAILED ERROR:", {
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack
    });
    
    throw new Error(`Email sending failed: ${error.message}`);
  }
}