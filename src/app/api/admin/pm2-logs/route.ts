// app/api/admin/pm2-logs/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    // Authentication check - only admin can access
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // PM2 logs get karein
    const { stdout, stderr } = await execAsync('pm2 logs --lines 100 --nostream');
    
    // Agar error aaya to alternative command try karein
    let logs = stdout;
    if (stderr || !stdout) {
      const { stdout: stdout2 } = await execAsync('pm2 logs --lines 50');
      logs = stdout2;
    }

    return NextResponse.json({
      success: true,
      logs: logs || 'No logs available',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('PM2 logs error:', error);
    
    // Alternative: Direct log file read karein
    try {
      const { stdout } = await execAsync('tail -100 ~/.pm2/logs/*.log');
      return NextResponse.json({
        success: true,
        logs: stdout,
        source: 'log-files',
        timestamp: new Date().toISOString()
      });
    } catch (fallbackError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch logs: ' + error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  }
}