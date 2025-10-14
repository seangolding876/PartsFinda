import 'dotenv/config';
import { register } from 'ts-node';

// TypeScript register karo ES Modules ke liye
register({
  project: './tsconfig.worker.json',
  esm: true,
  transpileOnly: true
});

// Ab .ts extension ke bina import karo
import RequestProcessor from '../workers/requestProcessor.js';

const processor = new RequestProcessor();

(async () => {
  console.log('🚀 Starting Request Processor Worker...');
  await processor.start();

  process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received');
    await processor.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received');
    await processor.stop();
    process.exit(0);
  });
})();