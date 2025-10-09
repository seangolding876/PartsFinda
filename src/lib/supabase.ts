import { createClient } from '@supabase/supabase-js';

// Supabase configuration with production-ready error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fallback configuration for development/mock data
const FALLBACK_CONFIG = {
  url: 'https://mock-supabase-endpoint.example.com',
  key: 'mock-anon-key-for-development'
};

// Create Supabase client with proper error handling
let supabase: any;

try {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your-supabase-url' && supabaseAnonKey !== 'your-anon-key') {
    // Production configuration with real Supabase
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    console.log('✅ Supabase client initialized with production config');
  } else {
    // Development/mock configuration
    console.warn('⚠️ Supabase environment variables not configured. Using mock database mode.');
    supabase = createMockSupabaseClient();
  }
} catch (error) {
  console.error('❌ Supabase initialization failed:', error);
  supabase = createMockSupabaseClient();
}

// Mock Supabase client for development/fallback
function createMockSupabaseClient() {
  return {
    auth: {
      signUp: async () => ({ data: null, error: new Error('Mock mode: Database not connected') }),
      signInWithPassword: async () => ({ data: null, error: new Error('Mock mode: Database not connected') }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: new Error('Mock mode: Database not connected') }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ data: [], error: new Error('Mock mode: Database not connected') }),
      insert: () => ({ data: null, error: new Error('Mock mode: Database not connected') }),
      update: () => ({ data: null, error: new Error('Mock mode: Database not connected') }),
      delete: () => ({ data: null, error: new Error('Mock mode: Database not connected') }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: new Error('Mock mode: Storage not connected') }),
        getPublicUrl: () => ({ data: { publicUrl: '/placeholder-image.jpg' } }),
      }),
    },
  };
}

// Test database connection (for debugging)
export const testSupabaseConnection = async () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return { connected: false, error: 'Environment variables not configured' };
    }

    const { data, error } = await supabase.from('test').select('*').limit(1);
    return { connected: !error, error: error?.message };
  } catch (error) {
    return { connected: false, error: (error as Error).message };
  }
};

export { supabase };

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
