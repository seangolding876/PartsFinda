// src/lib/mailService.ts - GODADDY VERSION (Updated as per working C# code)
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
    // console.log('🔍 GoDaddy SMTP Configuration Check:', {
    //   host: process.env.SMTP_HOST,
    //   port: process.env.SMTP_PORT,
    //   user: process.env.SMTP_USER,
    //   secure: process.env.SMTP_SECURE
    // });

    // Validate required environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('GoDaddy SMTP configuration is missing');
    }

    // ✅ GoDaddy Transporter Configuration (Matches your working C# settings)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.office365.com", // Using Office365 as in your C# code
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // ✅ MUST BE false for port 587 (matches your C# EnableSsl=true)
      auth: {
        user: process.env.SMTP_USER || "support@partsfinda.com", 
        pass: process.env.SMTP_PASS || "Partsfinda@123",
      },
      // Office365 specific settings
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      },
      requireTLS: true,
      connectionTimeout: 30000, // ✅ Matches your C# Timeout = 30000
      greetingTimeout: 10000,
      socketTimeout: 30000,
      debug: true,
      logger: true
    });

    //console.log('🔄 Verifying SMTP connection...');

    // Verify connection
    await transporter.verify();
    //console.log('✅ SMTP connection verified');

    // ✅ Use specific FROM address format (matches your C# code)
    const fromAddress = process.env.SMTP_FROM || `"PartsFinda Official" <support@partsfinda.com>`;
    // Alternative FROM addresses as in your C# code:
    // const fromAddress = `"PartsFinda System" <noreply@partsfinda.com>`;
    // const fromAddress = `"PartsFinda Alerts" <notifications@partsfinda.com>`;

    const mailOptions = {
      from: fromAddress,
      to: to,
      subject: subject,
      html: html,
      text: html.replace(/<[^>]*>/g, ''), // HTML to text
    };

    // console.log('📤 Sending email:', {
    //   from: mailOptions.from,
    //   to: mailOptions.to,
    //   subject: mailOptions.subject
    // });

    const info = await transporter.sendMail(mailOptions);

    // Detailed success logs
    // console.log("🎉 EMAIL SENT SUCCESSFULLY:", {
    //   messageId: info.messageId,
    //   response: info.response,
    //   accepted: info.accepted,
    //   rejected: info.rejected,
    //   envelope: info.envelope
    // });

    return { 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response 
    };

  } catch (error: any) {
    console.error("💥 EMAIL FAILED:", {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack
    });
    
    throw new Error(`Email failed: ${error.message}`);
  }
}