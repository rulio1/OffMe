import { pool } from '@/lib/db';
import { jsonOk, jsonError } from '@/lib/api-response';

export async function GET() {
  const useLocalFlag = process.env.USE_LOCAL_UPLOADS === 'true';
  const hasS3Keys = !!process.env.S3_ACCESS_KEY && !!process.env.S3_SECRET_KEY;
  const hasImgBB = !!process.env.IMGBB_API_KEY;
  const storageMode = useLocalFlag ? 'local' : (hasS3Keys ? 'r2/s3' : (hasImgBB ? 'imgbb' : 'local'));

  try {
    await pool.query('SELECT 1');
    return jsonOk({ 
      status: 'ok', 
      database: 'connected', 
      service: 'offme-api',
      storage: storageMode
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : 'unknown';
    const host = (process.env.DATABASE_URL ?? '').replace(/.*@([^/]+)\/.*/, '$1') || 'unset';
    console.error('[health] database error:', detail, 'host:', host);
    return jsonError(
      process.env.VERCEL
        ? `Database unavailable (${host}): ${detail}`
        : 'Database unavailable. Configure DATABASE_URL no .env.local (Neon etc)',
      503
    );
  }
}