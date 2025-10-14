import { RequestProcessor } from '../workers/requestProcessor';

console.log('🚀 Starting Production Worker...');
const processor = new RequestProcessor();
processor.start().then(() => {
  console.log('✅ Production Worker Started Successfully');
}).catch(error => {
  console.error('❌ Failed to start worker:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});