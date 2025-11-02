export type MessageStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
export type MessageType = 'general' | 'parts' | 'seller' | 'technical' | 'billing';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  type: MessageType;
  status: MessageStatus;
  admin_notes: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
}

export interface MessagesResponse {
  messages: ContactMessage[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    status: Array<{ status: string; count: number }>;
    type: Array<{ type: string; count: number }>;
  };
}