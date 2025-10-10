import { Pool, QueryResult } from 'pg';

const pool: Pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const query = (text: string, params?: any[]): Promise<QueryResult> => {
  return pool.query(text, params);
};