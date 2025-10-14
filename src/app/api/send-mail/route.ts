// src/app/api/send-email/route.ts
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailService";

export async function POST(req: Request) {
  try {
    const { to, subject, template } = await req.json();

    const result = await sendMail({
      to,
      subject,
      html: template,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("❌ Email sending failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
