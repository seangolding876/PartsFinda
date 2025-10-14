require('dotenv').config();

console.log('🚀 Starting PartsFinda Worker...');
console.log('Environment:', process.env.NODE_ENV);

// TypeScript file ko require karne ke liye
require('ts-node/register');

const RequestProcessor = require('../workers/requestProcessor').default;

async function startWorker() {
  try {
    const processor = new RequestProcessor();
    await processor.start();
    
    console.log('✅ Worker started successfully');
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

// Start the worker
startWorker();