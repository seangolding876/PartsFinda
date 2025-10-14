import { query } from '@/lib/db';
import { QueueItem } from '../types/database';

class RequestProcessor {
  private isProcessing: boolean = false;
  private processingStats = {
    processed: 0,
    failed: 0,
    retried: 0
  };

  async start(): Promise<void> {
    console.log('🚀 Starting request processor worker...');
    setInterval(() => this.processQueue(), 60000); // Every minute
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      const now = new Date();
      
      // TypeScript error fix: Simple query use karein
      const pendingRequests = await query(
        `SELECT 
          rq.id, rq.part_request_id, rq.seller_id, 
          pr.part_name, pr.description, pr.budget, pr.parish,
          u.name as buyer_name, u.email as buyer_email,
          s.name as seller_name, s.email as seller_email,
          pr.vehicle_year, pr.condition, pr.urgency,
          m.name as make_name, md.name as model_name
         FROM request_queue rq
         JOIN part_requests pr ON rq.part_request_id = pr.id
         JOIN users u ON pr.user_id = u.id
         JOIN users s ON rq.seller_id = s.id
         LEFT JOIN makes m ON pr.make_id = m.id
         LEFT JOIN models md ON pr.model_id = md.id
         WHERE rq.status = 'pending' 
         AND rq.scheduled_delivery_time <= $1
         AND rq.retry_count < 3
         ORDER BY rq.scheduled_delivery_time ASC`,
        [now]
      );

      // Type assertion use karein
      const queueItems = pendingRequests.rows as QueueItem[];

      console.log(`📋 Found ${queueItems.length} pending requests`);

      for (const request of queueItems) {
        await this.processSingleRequest(request);
      }

    } catch (error) {
      console.error('❌ Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processSingleRequest(queueItem: QueueItem): Promise<void> {
    try {
      console.log(`🔄 Processing request ${queueItem.part_request_id} for seller ${queueItem.seller_name}`);
      console.log(`🚗 Vehicle: ${queueItem.make_name} ${queueItem.model_name} ${queueItem.vehicle_year}`);
      console.log(`💰 Budget: $${queueItem.budget}`);
      console.log(`📍 Location: ${queueItem.parish}`);
      
      // Seller notification logic
      await this.notifySeller(queueItem);
      
      // Queue item ko processed mark karein
      await query(
        `UPDATE request_queue 
         SET status = 'processed', processed_at = $1 
         WHERE id = $2`,
        [new Date(), queueItem.id]
      );

      this.processingStats.processed++;
      console.log(`✅ Processed request ${queueItem.part_request_id}`);

    } catch (error: any) {
      console.error(`❌ Error processing request ${queueItem.id}:`, error);
      
      // Retry logic
      await query(
        `UPDATE request_queue 
         SET retry_count = retry_count + 1,
             status = CASE WHEN retry_count >= 2 THEN 'failed' ELSE 'pending' END,
             last_error = $1
         WHERE id = $2`,
        [error.message, queueItem.id]
      );

      this.processingStats.failed++;
    }
  }

  async notifySeller(requestData: QueueItem): Promise<void> {
    try {
      // Email template generate karein
      const emailTemplate = `
        <h2>🚗 New Part Request Available!</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h3>Part Details:</h3>
          <p><strong>Part Name:</strong> ${requestData.part_name}</p>
          <p><strong>Vehicle:</strong> ${requestData.make_name} ${requestData.model_name} ${requestData.vehicle_year}</p>
          <p><strong>Condition:</strong> ${requestData.condition}</p>
          <p><strong>Urgency:</strong> ${requestData.urgency}</p>
          <p><strong>Budget:</strong> $${requestData.budget || 'Not specified'}</p>
          <p><strong>Location:</strong> ${requestData.parish}</p>
          <p><strong>Buyer:</strong> ${requestData.buyer_name}</p>
          
          <h4>Description:</h4>
          <p>${requestData.description}</p>
        </div>
        <p style="margin-top: 20px;">
          <a href="/seller/requests" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Request & Submit Quote
          </a>
        </p>
      `;

      // Database mein notification save karein
      await query(
        `INSERT INTO seller_notifications 
         (seller_id, part_request_id, title, message, type, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          requestData.seller_id,
          requestData.part_request_id,
          `New Part Request: ${requestData.part_name}`,
          emailTemplate,
          'part_request',
          new Date()
        ]
      );

      console.log(`📧 Notification created for seller: ${requestData.seller_name}`);

    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  // Admin ke liye stats
  getStats() {
    return {
      ...this.processingStats,
      isProcessing: this.isProcessing,
      lastUpdated: new Date()
    };
  }

  // Queue status for admin
  async getQueueStatus() {
    const statusResult = await query(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (processed_at - scheduled_delivery_time))) as avg_delay_seconds
      FROM request_queue 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY status
    `);

    const pendingDetails = await query(`
      SELECT 
        COUNT(*) as total_pending,
        AVG(EXTRACT(EPOCH FROM (NOW() - scheduled_delivery_time))) as avg_delay_seconds
      FROM request_queue 
      WHERE status = 'pending'
      AND scheduled_delivery_time <= NOW()
    `);

    return {
      status: statusResult.rows,
      pendingDetails: pendingDetails.rows[0],
      workerStats: this.getStats()
    };
  }
}

export default RequestProcessor;