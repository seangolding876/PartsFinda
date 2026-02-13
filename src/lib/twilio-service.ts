import twilio from 'twilio';
import type { Twilio } from 'twilio';
import type { SmsOptions, SmsResponse, BulkSmsOptions, BulkSmsResponse } from '@/types/twilio.types';

class TwilioService {
  private client: Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials are missing in environment variables');
    }

    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
  }

  async sendSMS({ to, message }: SmsOptions): Promise<SmsResponse> {
    try {
      // Basic phone number validation
      if (!to || !message) {
        throw new Error('Phone number and message are required');
      }

      const twilioMessage = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to
      });

      return { 
        success: true, 
        messageId: twilioMessage.sid 
      };
    } catch (error) {
      console.error('Twilio SMS Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  async sendBulkSMS({ recipients, message }: BulkSmsOptions): Promise<BulkSmsResponse> {
    const results = await Promise.all(
      recipients.map(recipient => 
        this.sendSMS({ to: recipient, message })
      )
    );

    const failedCount = results.filter(r => !r.success).length;

    return {
      success: failedCount === 0,
      results,
      failedCount
    };
  }

  async sendOTP(phoneNumber: string): Promise<{ otp: string } & SmsResponse> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const result = await this.sendSMS({
      to: phoneNumber,
      message: `Your verification code is: ${otp}`
    });

    return {
      ...result,
      otp
    };
  }
}

// Singleton instance
const twilioService = new TwilioService();
export default twilioService;