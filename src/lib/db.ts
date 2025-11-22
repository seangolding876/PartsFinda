import { Pool } from 'pg';
import { PartRequest, QueueItem, User } from '../../types/database';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});


// Generic query function with proper TypeScript support
export const query = async <T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Connect to database function
export const connectToDatabase = async () => {
  try {
    const client = await pool.connect();
   // console.log('✅ Connected to PostgreSQL database');
    return { client, pool };
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

// Specific type queries ke liye helper functions
export const queryWithTypes = {
  async queueItems<T = QueueItem>(text: string, params?: any[]): Promise<{ rows: T[] }> {
    return query<T>(text, params);
  },
  
  async users<T = User>(text: string, params?: any[]): Promise<{ rows: T[] }> {
    return query<T>(text, params);
  },
  
  async partRequests<T = PartRequest>(text: string, params?: any[]): Promise<{ rows: T[] }> {
    return query<T>(text, params);
  }
};