// pages/api/socket.io/[...path].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Server } from 'socket.io';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!(res.socket as any).server.io) {
        console.log('Initializing Socket.io server...');
        
        const io = new Server((res.socket as any).server, {
            path: '/api/socket.io',
        });

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        (res.socket as any).server.io = io;
    }
    res.end();
}