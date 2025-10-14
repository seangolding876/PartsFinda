import type { NextApiRequest, NextApiResponse } from "next";
import { sendMail } from "@/lib/mailService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, subject, template } = req.body;

  try {
    const result = await sendMail({ to, subject, html: template });
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
