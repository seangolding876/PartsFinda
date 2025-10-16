import { NextApiRequest, NextApiResponse } from 'next';
import { initSocketServer } from '@/lib/socket-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Initialize socket server
  if (!(res.socket as any).server.io) {
    console.log('Initializing socket server...');
    const httpServer = (res.socket as any).server;
    initSocketServer(httpServer);
    (res.socket as any).server.io = true;
  }
  
  res.end();
}