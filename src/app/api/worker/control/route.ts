import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    let command = '';
    
    switch (action) {
      case 'start':
        command = 'pm2 start /var/www/partsfinda/.dist-worker/partsfinda-worker.js --name partsfinda-worker';
        break;
      case 'stop':
        command = 'pm2 stop partsfinda-worker';
        break;
      case 'restart':
        command = 'pm2 restart partsfinda-worker';
        break;
      case 'status':
        command = 'pm2 show partsfinda-worker';
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        });
    }

    // Actual path update karo
    command = command.replace('/var/www/partsfinda/.dist-worker/', process.env.WORKER_PATH || './.dist/');

    const { stdout, stderr } = await execAsync(command);

    return NextResponse.json({
      success: true,
      action,
      message: `Worker ${action}ed successfully`,
      output: stdout
    });

  } catch (error: any) {
    console.error('Worker control error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}