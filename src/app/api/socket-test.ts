import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    message: 'Socket test successful',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}