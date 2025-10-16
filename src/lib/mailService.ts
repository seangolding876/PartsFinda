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
    console.log('📧 Preparing to send email...', {
      to,
      subject,
      smtpHost: process.env.SMTP_HOST,
      smtpUser: process.env.SMTP_USER
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT!) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
      // Add better error handling
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const mailOptions = {
      from: `"PartsFinda" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      // Add text version for better deliverability
      text: html.replace(/<[^>]*>/g, ''), // Basic HTML to text conversion
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully:", {
      messageId: info.messageId,
      to: to,
      subject: subject
    });

    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response 
    };

  } catch (error: any) {
    console.error("❌ Email sending failed:", {
      error: error.message,
      code: error.code,
      to: to,
      subject: subject
    });
    
    throw new Error(`Email sending failed: ${error.message}`);
  }
}