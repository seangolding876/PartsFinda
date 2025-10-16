import { NextApiRequest, NextApiResponse } from "next";
import { initSocketServer } from '@/lib/socket-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function SocketHandler(req: NextApiRequest, res: NextApiResponse) {
  // Initialize socket server if not already initialized
  if (!(res.socket as any).server.io) {
    console.log('🔄 Initializing Socket.IO server in API route...');
    
    const httpServer = (res.socket as any).server;
    initSocketServer(httpServer);
    
    (res.socket as any).server.io = true;
    console.log('✅ Socket.IO server initialized via API route');
  } else {
    console.log('✅ Socket.IO server already initialized');
  }
  
  res.end();
}