// app/api/admin/pm2-logs/worker/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📋 Fetching logs for partsfinda-worker...');

    // Specific worker ke logs get karein
    const { stdout, stderr } = await execAsync('pm2 logs partsfinda-worker --lines 100 --nostream');
    
    let logs = stdout;
    
    // Agar error aaya to alternative commands try karein
    if (stderr || !stdout) {
      try {
        // Alternative 1: Direct log file read
        const { stdout: stdout2 } = await execAsync('tail -100 ~/.pm2/logs/partsfinda-worker-out.log');
        logs = stdout2;
      } catch (fileError) {
        try {
          // Alternative 2: PM2 describe se logs
          const { stdout: stdout3 } = await execAsync('pm2 describe partsfinda-worker');
          logs = stdout3;
        } catch (describeError) {
          // Alternative 3: All PM2 logs se filter karein
          const { stdout: stdout4 } = await execAsync('pm2 logs --lines 50 --nostream');
          logs = this.filterWorkerLogs(stdout4);
        }
      }
    }

    return NextResponse.json({
      success: true,
      process: 'partsfinda-worker',
      logs: logs || 'No logs available for partsfinda-worker',
      lines: 100,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('PM2 worker logs error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch worker logs: ' + error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper function to filter worker-specific logs
function filterWorkerLogs(allLogs: string): string {
  const lines = allLogs.split('\n');
  const workerLines = lines.filter(line => 
    line.includes('partsfinda-worker') || 
    line.includes('worker') ||
    line.toLowerCase().includes('background')
  );
  return workerLines.join('\n');
}