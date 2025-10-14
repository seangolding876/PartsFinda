"use server";
const nodemailer = await import("nodemailer");

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailParams) {
  try {
    // Type-safe transporter config
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST as string,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER as string,
        pass: process.env.SMTP_PASS as string,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM as string,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error("❌ Email send error:", err.message);
    return { success: false, error: err.message };
  }
}
