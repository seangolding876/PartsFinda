// src/lib/mailService.ts
import nodemailer from "nodemailer";

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT!) || 587,
    secure: true,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  const info = await transporter.sendMail({
    from: `"PartsFinda" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  console.log("📨 Using SMTP config:", {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
});

  console.log("📧 Email sent:", info.messageId);
  return { success: true, messageId: info.messageId };
}
