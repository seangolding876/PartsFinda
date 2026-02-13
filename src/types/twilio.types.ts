export interface SmsOptions {
  to: string;
  message: string;
}

export interface SmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkSmsOptions {
  recipients: string[];
  message: string;
}

export interface BulkSmsResponse {
  success: boolean;
  results: SmsResponse[];
  failedCount: number;
}