// Load environment variables
require('dotenv').config();

// Enable TypeScript execution
require('ts-node/register');

// Import your TS worker
const RequestProcessor = require('../workers/requestProcessor').default;

(async () => {
  try {
    const processor = new RequestProcessor();
    await processor.start();
    console.log('✅ Worker started successfully');

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, exiting...');
      process.exit(0);
    });
    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, exiting...');
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Worker failed:', err);
    process.exit(1);
  }
})();
