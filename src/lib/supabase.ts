import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wdqkmxywspgibgkekvvb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcWtteHl3c3BnaWJna2VrdnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MzQ0MjgsImV4cCI6MjA1MTUxMDQyOH0.t79GAa9etmlr4w1YuXJzMjBCJn5vGzjwIMpEcISwJxE';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Part {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  brand: string;
  warranty: string;
  shipping: string;
  seller_id: string;
  seller_name: string;
  seller_rating: number;
  image_url: string;
  vehicle_compatibility: string[];
  oem_number?: string;
  quantity_available: number;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  location?: string;
  role: 'buyer' | 'seller' | 'both';
  rating?: number;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export interface Order {
  id: string;
  user_id: string;
  items: any[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  created_at: string;
}
