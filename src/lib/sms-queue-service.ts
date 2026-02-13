import { query } from '@/lib/db';
import twilioService from './twilio-service';

interface QueueSmsOptions {
  userId: string;
  phone: string;
  message: string;
  type: string;
  referenceId: string;
  scheduledFor?: Date;
  maxRetries?: number;
  priority?: 'high' | 'normal' | 'low';
}

class SmsQueueService {
  // ============= 1. QUEUE SMS =============
  async queueSms(options: QueueSmsOptions): Promise<number> {
    const { 
      userId, 
      phone, 
      message, 
      type, 
      referenceId, 
      scheduledFor = new Date(),
      maxRetries = 3,
      priority = 'normal'
    } = options;

    // Validate phone number
    if (!phone || phone.trim() === '') {
      throw new Error('Phone number is required');
    }

    // Validate message
    if (!message || message.trim() === '') {
      throw new Error('Message is required');
    }

    try {
      const result = await query(
        `INSERT INTO sms_queue 
         (user_id, phone_number, message, type, reference_id, scheduled_for, max_retries, priority, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
         RETURNING id`,
        [userId, phone, message, type, referenceId, scheduledFor, maxRetries, priority]
      );

      const queueId = result.rows[0].id;
      console.log(`✅ SMS queued [${queueId}] for ${phone} (${type})`);
      
      return queueId;
    } catch (error) {
      console.error('❌ Failed to queue SMS:', error);
      throw error;
    }
  }

  // ============= 2. PROCESS PENDING SMS =============
  async processPendingSms(limit: number = 10): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0
    };

    try {
      // Get pending SMS with priority order
      const pendingSms = await query(
        `SELECT * FROM sms_queue 
         WHERE status = 'pending' 
         AND scheduled_for <= CURRENT_TIMESTAMP
         AND retry_count < max_retries
         ORDER BY 
           CASE priority
             WHEN 'high' THEN 1
             WHEN 'normal' THEN 2
             WHEN 'low' THEN 3
             ELSE 4
           END,
           scheduled_for ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED`,
        [limit]
      );

      console.log(`📱 Processing ${pendingSms.rows.length} SMS messages`);

      for (const sms of pendingSms.rows) {
        results.processed++;
        
        try {
          // Mark as processing
          await this.updateStatus(sms.id, 'processing');

          // Send SMS via Twilio
          const twilioResult = await twilioService.sendSMS({
            to: sms.phone_number,
            message: sms.message
          });

          if (twilioResult.success) {
            // Mark as sent
            await this.markAsSent(sms.id, twilioResult.messageId!);
            results.successful++;
            
            // Move to logs
            await this.archiveToLogs(sms.id, 'sent', twilioResult.messageId);
            
            console.log(`✅ SMS ${sms.id} sent to ${sms.phone_number}`);
          } else {
            throw new Error(twilioResult.error || 'Unknown Twilio error');
          }
        } catch (error) {
          results.failed++;
          await this.handleFailure(sms.id, error);
          console.error(`❌ SMS ${sms.id} failed:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    } catch (error) {
      console.error('❌ Error processing SMS queue:', error);
    }

    return results;
  }

  // ============= 3. UPDATE STATUS =============
  private async updateStatus(
    queueId: number, 
    status: string, 
    errorMessage?: string
  ): Promise<void> {
    await query(
      `UPDATE sms_queue 
       SET status = $1, 
           error_message = $2,
           processed_at = CASE WHEN $1 IN ('sent', 'failed') THEN CURRENT_TIMESTAMP ELSE processed_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, errorMessage || null, queueId]
    );
  }

  // ============= 4. MARK AS SENT =============
  private async markAsSent(queueId: number, twilioMessageId: string): Promise<void> {
    await query(
      `UPDATE sms_queue 
       SET status = 'sent', 
           twilio_message_id = $1,
           processed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [twilioMessageId, queueId]
    );
  }

  // ============= 5. HANDLE FAILURE =============
  private async handleFailure(queueId: number, error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await query(
      `UPDATE sms_queue 
       SET retry_count = retry_count + 1,
           status = CASE 
             WHEN retry_count + 1 >= max_retries THEN 'failed' 
             ELSE 'pending' 
           END,
           error_message = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [errorMessage, queueId]
    );
  }

  // ============= 6. ARCHIVE TO LOGS =============
  private async archiveToLogs(
    queueId: number, 
    status: string, 
    twilioMessageId?: string
  ): Promise<void> {
    // Get the SMS details
    const sms = await query('SELECT * FROM sms_queue WHERE id = $1', [queueId]);
    
    if (sms.rows.length > 0) {
      const data = sms.rows[0];
      
      // Insert into logs
      await query(
        `INSERT INTO sms_logs 
         (queue_id, user_id, phone_number, message, type, status, reference_id, twilio_message_id, sent_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
        [
          queueId,
          data.user_id,
          data.phone_number,
          data.message,
          data.type,
          status,
          data.reference_id,
          twilioMessageId
        ]
      );

      // Delete from queue after successful send
      if (status === 'sent') {
        await query('DELETE FROM sms_queue WHERE id = $1', [queueId]);
        console.log(`📦 SMS ${queueId} moved to logs and deleted from queue`);
      }
    }
  }

  // ============= 7. GET QUEUE STATS =============
  async getQueueStats(): Promise<any> {
    const stats = await query(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(CASE WHEN status = 'sent' AND created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as sent_count,
        AVG(CASE WHEN status = 'pending' THEN EXTRACT(EPOCH FROM (NOW() - created_at)) END) as avg_wait_time_seconds,
        COUNT(DISTINCT type) as unique_types
      FROM sms_queue
    `);
    
    return stats.rows[0];
  }

  // ============= 8. RETRY FAILED SMS =============
  async retryFailedSms(limit: number = 10): Promise<number> {
    const result = await query(
      `UPDATE sms_queue 
       SET status = 'pending', 
           retry_count = 0,
           error_message = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE status = 'failed' 
       AND retry_count >= max_retries
       AND created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
       LIMIT $1
       RETURNING id`,
      [limit]
    );
    
    const count = result.rows.length;
    console.log(`🔄 Reset ${count} failed SMS for retry`);
    return count;
  }

  // ============= 9. GET QUEUE BY USER =============
  async getQueueByUser(userId: number, limit: number = 10): Promise<any[]> {
    const result = await query(
      `SELECT * FROM sms_queue 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    
    return result.rows;
  }

  // ============= 10. CANCEL QUEUED SMS =============
  async cancelQueuedSms(queueId: number, userId: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM sms_queue 
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING id`,
      [queueId, userId]
    );
    
    return result.rows.length > 0;
  }
}

// Singleton export
const smsQueueService = new SmsQueueService();
export default smsQueueService;