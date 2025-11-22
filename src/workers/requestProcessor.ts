export default class RequestProcessor {
  private isProcessing = false;

  constructor() {
   // console.log('🔄 Worker Initialized');
  }

  async start() {
    //console.log('🚀 Worker Started');

    // Repeat every 5 seconds
    setInterval(() => this.processQueue(), 5000);

    // First run immediately
    await this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing) return;

    this.isProcessing = true;
   // console.log('👋 Hello World', new Date().toISOString());
    this.isProcessing = false;
  }
}
