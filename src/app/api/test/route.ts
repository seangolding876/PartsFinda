import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for") ||
    (request as any).socket?.remoteAddress ||
    "unknown";

  const allowed = await rateLimit(ip, 50, 60); // 50 req / minute

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests, try again later." },
      { status: 429 }
    );
  }

  return NextResponse.json({ success: true });
}
