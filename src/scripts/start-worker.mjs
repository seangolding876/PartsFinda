import 'dotenv/config';

// ✅ Compiled JavaScript file import karo
import RequestProcessor from '../dist-workers/workers/requestProcessor.js';

const processor = new RequestProcessor();

(async () => {
 // console.log('🚀 Starting Request Processor Worker...');
  await processor.start();

  process.on('SIGTERM', async () => {
   // console.log('🛑 SIGTERM received');
    await processor.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
   // console.log('🛑 SIGINT received');
    await processor.stop();
    process.exit(0);
  });
})();