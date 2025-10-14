import { Pool } from 'pg';
import { PartRequest, QueueItem, User } from '../../types/database';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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