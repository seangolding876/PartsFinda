import 'dotenv/config';
import RequestProcessor from '../workers/requestProcessor.ts'; // TypeScript ES Module

// TypeScript execution
import 'ts-node/register';

const processor = new RequestProcessor();

(async () => {
  await processor.start();

  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('🛑 SIGINT received');
    process.exit(0);
  });
})();
