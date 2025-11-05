// src/app/api/send-mail/route.ts
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailService";

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    console.log('📧 API Route - Received request:', { to, subject });

    // Validate input
    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    const result = await sendMail({
      to,
      subject,
      html,
    });

    console.log('✅ API Route - Email sent successfully');

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      accepted: result.accepted
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ API Route - Email sending failed:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Internal Server Error",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}