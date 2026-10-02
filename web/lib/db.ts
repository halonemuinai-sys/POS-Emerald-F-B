import { Pool } from 'pg';

let pool: Pool;

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.PG_HOST || '127.0.0.1',
      port: parseInt(process.env.PG_PORT || '5432'),
      user: process.env.PG_USER || 'mrafnb',
      password: process.env.PG_PASSWORD || 'fnb@2031mra',
      database: process.env.PG_DATABASE || 'pos_emerald',
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const p = getDbPool();
  const start = Date.now();
  const res = await p.query(text, params);
  const duration = Date.now() - start;
  return res;
}
