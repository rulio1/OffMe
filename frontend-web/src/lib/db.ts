import { Pool, type PoolConfig } from 'pg';

const globalForPg = globalThis as unknown as { pgPool?: Pool };

function resolveSsl(): PoolConfig['ssl'] | undefined {
  const url = process.env.DATABASE_URL ?? '';
  if (process.env.DATABASE_SSL === 'true' || url.includes('sslmode=require')) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

function createPool(): Pool {
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://offme:offme_dev@localhost:5432/offme';
  const isServerless = Boolean(process.env.VERCEL);

  return new Pool({
    connectionString,
    max: isServerless ? 1 : 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: resolveSsl(),
  });
}

export const pool = globalForPg.pgPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pgPool = pool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}