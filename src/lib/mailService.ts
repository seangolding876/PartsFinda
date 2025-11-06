// src/lib/mailService.ts - PORT 465 VERSION
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
    console.log('🔍 GoDaddy SMTP Configuration (Port 465):', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      secure: process.env.SMTP_SECURE
    });

    // Validate required environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('GoDaddy SMTP configuration is missing');
    }

    // GoDaddy Port 465 with SSL
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // smtpout.secureserver.net
      port: 465, // ✅ Fixed port 465
      secure: true, // ✅ SSL enabled for port 465
      auth: {
        user: process.env.SMTP_USER, // support@partsfinda.com
        pass: process.env.SMTP_PASS, // Partsfinda@123
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 15000,
      debug: true,
      logger: true
    });

    console.log('🔄 Verifying GoDaddy SMTP (Port 465)...');

    // Verify connection
    await transporter.verify();
    console.log('✅ GoDaddy SMTP (Port 465) connection verified');

    const fromAddress = process.env.SMTP_FROM || `"PartsFinda Support" <${process.env.SMTP_USER}>`;

    const mailOptions = {
      from: fromAddress,
      to: to,
      subject: subject,
      html: html,
      text: html.replace(/<[^>]*>/g, ''),
    };

    console.log('📤 Sending via GoDaddy (Port 465):', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);

    console.log("🎉 GODADDY EMAIL SENT (Port 465):", {
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response
    });

    return { 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response 
    };

  } catch (error: any) {
    console.error("💥 GODADDY EMAIL FAILED (Port 465):", {
      error: error.message,
      code: error.code,
      command: error.command
    });
    
    throw new Error(`GoDaddy email failed: ${error.message}`);
  }
}