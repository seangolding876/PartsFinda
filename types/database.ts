// Database types definition
export interface QueueItem {
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
  vehicle_year: number;
  condition: string;
  urgency: string;
  make_name: string;
  model_name: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  membership_plan: string;
  role: string;
}

export interface PartRequest {
  id: number;
  user_id: number;
  part_name: string;
  part_number?: string;
  make_id: string;
  model_id: string;
  vehicle_year: number;
  description: string;
  budget?: number;
  parish: string;
  condition: 'new' | 'used' | 'refurbished' | 'any';
  urgency: 'low' | 'medium' | 'high';
  status: string;
  created_at: Date;
  expires_at: Date;
  delivery_schedule?: Date;
  membership_plan_at_request: string;
}