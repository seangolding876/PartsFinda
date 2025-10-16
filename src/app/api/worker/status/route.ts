import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // PM2 se worker status check karenge
    const { stdout } = await execAsync('pm2 jlist');
    const pm2Processes = JSON.parse(stdout);
    
    const workerProcess = pm2Processes.find((p: any) => p.name === 'partsfinda-worker');
    
    if (workerProcess) {
      return NextResponse.json({
        success: true,
        worker: {
          status: workerProcess.pm2_env.status,
          name: workerProcess.name,
          uptime: Date.now() - workerProcess.pm2_env.pm_uptime,
          memory: workerProcess.monit.memory,
          cpu: workerProcess.monit.cpu,
          restarts: workerProcess.pm2_env.restart_time,
          pid: workerProcess.pid
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        worker: null,
        error: 'Worker not running'
      });
    }
  } catch (error) {
    console.error('PM2 status error:', error);
    return NextResponse.json({
      success: false,
      error: 'PM2 not available or worker not running'
    });
  }
}