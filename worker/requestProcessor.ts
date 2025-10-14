import { query } from '../src/lib/db';

interface QueueItem {
  id: string;
  part_request_id: number;
  seller_id: number;
  part_name: string;
  description: string;
  budget: number | null;
  parish: string;
  buyer_name: string;
  buyer_email: string;
  seller_name: string;
  seller_email: string;
  seller_membership: string;
  vehicle_year: number;
  condition: string;
  urgency: string;
  make_name: string;
  model_name: string;
}

class RequestProcessor {
  private isProcessing: boolean = false;
  private stats = {
    processed: 0,
    failed: 0,
    totalProcessed: 0
  };

  async start(): Promise<void> {
    console.log('🚀 Starting Production Request Processor Worker...');
    console.log('⏰ Checking queue every minute for pending requests');
    
    // Immediate first check
    this.processQueue();
    
    // Regular interval
    setInterval(() => this.processQueue(), 60000);
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('⏳ Queue processing already in progress, skipping...');
      return;
    }
    
    this.isProcessing = true;
    const startTime = Date.now();
    
    try {
      const now = new Date();
      console.log(`🔍 [${now.toISOString()}] Checking queue for deliverable requests...`);
      
      const pendingRequests = await query(
        `SELECT 
          rq.id, rq.part_request_id, rq.seller_id, 
          pr.part_name, pr.description, pr.budget, pr.parish,
          u.name as buyer_name, u.email as buyer_email,
          s.name as seller_name, s.email as seller_email,
          s.membership_plan as seller_membership,
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
         ORDER BY 
           s.membership_plan ASC,  -- Premium sellers first
           rq.scheduled_delivery_time ASC`,
        [now]
      );

      const queueItems = pendingRequests.rows as QueueItem[];

      if (queueItems.length === 0) {
        console.log('✅ No pending requests ready for delivery');
        return;
      }

      console.log(`📦 Found ${queueItems.length} requests ready for delivery`);
      
      let successCount = 0;
      let failCount = 0;

      // Process each queue item
      for (const item of queueItems) {
        try {
          await this.processSingleRequest(item);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to process queue item ${item.id}:`, error);
          failCount++;
        }
      }

      const endTime = Date.now();
      console.log(`🎉 Delivery batch completed:`);
      console.log(`   ✅ Success: ${successCount}`);
      console.log(`   ❌ Failed: ${failCount}`);
      console.log(`   ⏱️  Time taken: ${endTime - startTime}ms`);

      this.stats.processed += successCount;
      this.stats.failed += failCount;
      this.stats.totalProcessed += successCount;

    } catch (error: any) {
      console.error('💥 CRITICAL: Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processSingleRequest(queueItem: QueueItem): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`\n📤 DELIVERING to ${queueItem.seller_name} [${queueItem.seller_membership.toUpperCase()}]`);
      console.log(`   🚗 ${queueItem.make_name} ${queueItem.model_name} ${queueItem.vehicle_year}`);
      console.log(`   🔧 ${queueItem.part_name} | ${queueItem.condition} | ${queueItem.urgency}`);
      console.log(`   💰 Budget: $${queueItem.budget || 'Not specified'} | 📍 ${queueItem.parish}`);
      
      // Step 1: Create notification for seller
      await this.createSellerNotification(queueItem);
      
      // Step 2: Send email notification (if configured)
      await this.sendEmailNotification(queueItem);
      
      // Step 3: Mark as processed
      await query(
        `UPDATE request_queue 
         SET status = 'processed', processed_at = $1 
         WHERE id = $2`,
        [new Date(), queueItem.id]
      );

      const endTime = Date.now();
      console.log(`   ✅ DELIVERED in ${endTime - startTime}ms`);

    } catch (error: any) {
      console.error(`   ❌ DELIVERY FAILED: ${error.message}`);
      
      // Update retry count
      const retryResult = await query(
        `UPDATE request_queue 
         SET retry_count = retry_count + 1,
             status = CASE WHEN retry_count >= 2 THEN 'failed' ELSE 'pending' END,
             last_error = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING retry_count`,
        [error.message, queueItem.id]
      );

      const newRetryCount = retryResult.rows[0]?.retry_count || 0;
      console.log(`   🔄 Retry count: ${newRetryCount}/3`);
      
      throw error;
    }
  }

  async createSellerNotification(queueItem: QueueItem): Promise<void> {
    try {
      await query(
        `INSERT INTO seller_notifications 
         (seller_id, part_request_id, title, message, type, metadata, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          queueItem.seller_id,
          queueItem.part_request_id,
          `New Part Request: ${queueItem.part_name}`,
          this.generateNotificationMessage(queueItem),
          'part_request',
          JSON.stringify({
            vehicle: `${queueItem.make_name} ${queueItem.model_name} ${queueItem.vehicle_year}`,
            condition: queueItem.condition,
            urgency: queueItem.urgency,
            budget: queueItem.budget,
            parish: queueItem.parish,
            buyer_name: queueItem.buyer_name
          }),
          new Date()
        ]
      );
    } catch (error) {
      console.error('   ❌ Failed to create notification:', error);
      throw error;
    }
  }

  async sendEmailNotification(queueItem: QueueItem): Promise<void> {
    try {
      // Production email service integration yahan aayegi
      // Example: SendGrid, AWS SES, etc.
      
      const emailData = {
        to: queueItem.seller_email,
        subject: `🚗 New Part Request: ${queueItem.part_name}`,
        html: this.generateEmailTemplate(queueItem),
        from: process.env.EMAIL_FROM || 'notifications@partsfinda.com'
      };
      
      console.log(`   📧 Email ready for: ${queueItem.seller_email}`);
      // await emailService.send(emailData);
      
    } catch (error) {
      console.error('   ⚠️  Email notification failed (continuing anyway):', error);
      // Email failure shouldn't stop the main delivery process
    }
  }

  generateNotificationMessage(queueItem: QueueItem): string {
    return `
NEW PART REQUEST - ${queueItem.part_name}

Vehicle: ${queueItem.make_name} ${queueItem.model_name} ${queueItem.vehicle_year}
Part: ${queueItem.part_name}
Condition: ${queueItem.condition}
Urgency: ${queueItem.urgency}

Budget: $${queueItem.budget || 'Not specified'}
Location: ${queueItem.parish}

Description: ${queueItem.description}

Buyer: ${queueItem.buyer_name}

Respond quickly to win this order!
    `.trim();
  }

  generateEmailTemplate(queueItem: QueueItem): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .detail-row { margin-bottom: 10px; }
        .label { font-weight: bold; color: #4b5563; }
        .urgency-high { color: #dc2626; font-weight: bold; }
        .urgency-medium { color: #d97706; font-weight: bold; }
        .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚗 New Part Request!</h1>
            <p>You have a new part request matching your business</p>
        </div>
        <div class="content">
            <div class="detail-row">
                <span class="label">Part Name:</span> ${queueItem.part_name}
            </div>
            <div class="detail-row">
                <span class="label">Vehicle:</span> ${queueItem.make_name} ${queueItem.model_name} ${queueItem.vehicle_year}
            </div>
            <div class="detail-row">
                <span class="label">Condition:</span> ${queueItem.condition}
            </div>
            <div class="detail-row">
                <span class="label">Urgency:</span> 
                <span class="urgency-${queueItem.urgency}">${queueItem.urgency.toUpperCase()}</span>
            </div>
            <div class="detail-row">
                <span class="label">Budget:</span> $${queueItem.budget || 'Not specified'}
            </div>
            <div class="detail-row">
                <span class="label">Location:</span> ${queueItem.parish}
            </div>
            <div class="detail-row">
                <span class="label">Buyer:</span> ${queueItem.buyer_name}
            </div>
            <div class="detail-row">
                <span class="label">Description:</span><br>
                ${queueItem.description}
            </div>
            
            <a href="${process.env.APP_URL}/seller/requests/${queueItem.part_request_id}" class="btn">
                View Request & Submit Quote
            </a>
            
            <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
                This request was delivered based on your ${queueItem.seller_membership.toUpperCase()} membership plan.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  // Admin monitoring ke liye
  getStats() {
    return {
      ...this.stats,
      isProcessing: this.isProcessing,
      lastUpdated: new Date().toISOString()
    };
  }

  async getQueueStatus() {
    try {
      const statusResult = await query(`
        SELECT 
          rq.status,
          s.membership_plan,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (rq.processed_at - rq.scheduled_delivery_time))) as avg_delay_seconds
        FROM request_queue rq
        JOIN users s ON rq.seller_id = s.id
        WHERE rq.created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY rq.status, s.membership_plan
        ORDER BY s.membership_plan, rq.status
      `);

      const pendingDetails = await query(`
        SELECT 
          COUNT(*) as total_pending,
          COUNT(CASE WHEN s.membership_plan = 'basic' THEN 1 END) as basic_pending,
          COUNT(CASE WHEN s.membership_plan IN ('premium', 'enterprise') THEN 1 END) as premium_pending,
          AVG(EXTRACT(EPOCH FROM (NOW() - rq.scheduled_delivery_time))) as avg_delay_seconds,
          MIN(rq.scheduled_delivery_time) as oldest_pending
        FROM request_queue rq
        JOIN users s ON rq.seller_id = s.id
        WHERE rq.status = 'pending'
        AND rq.scheduled_delivery_time <= NOW()
      `);

      const deliveryStats = await query(`
        SELECT 
          s.membership_plan,
          COUNT(*) as total_delivered,
          AVG(EXTRACT(EPOCH FROM (rq.processed_at - rq.scheduled_delivery_time))) as avg_delivery_time
        FROM request_queue rq
        JOIN users s ON rq.seller_id = s.id
        WHERE rq.status = 'processed'
        AND rq.processed_at >= NOW() - INTERVAL '24 hours'
        GROUP BY s.membership_plan
        ORDER BY s.membership_plan
      `);

      return {
        status: statusResult.rows,
        pendingDetails: pendingDetails.rows[0],
        deliveryStats: deliveryStats.rows,
        workerStats: this.getStats()
      };
    } catch (error) {
      console.error('Error getting queue status:', error);
      throw error;
    }
  }
}

export default RequestProcessor;