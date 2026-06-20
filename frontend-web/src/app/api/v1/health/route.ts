import { pool } from '@/lib/db';
import { jsonOk, jsonError } from '@/lib/api-response';

export async function GET() {
  try {
    await pool.query('SELECT 1');
    return jsonOk({ status: 'ok', database: 'connected', service: 'offme-api' });
  } catch {
    return jsonError('Database unavailable', 503);
  }
}