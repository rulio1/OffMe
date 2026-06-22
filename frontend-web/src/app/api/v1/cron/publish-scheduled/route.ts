import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { publishDuePosts } from '@/lib/post-repository';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return jsonError('Cron não configurado', 503);

  const auth = request.headers.get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const headerSecret = request.headers.get('x-cron-secret');
  if (bearer !== secret && headerSecret !== secret) {
    return jsonError('Não autorizado', 401);
  }

  try {
    const published = await publishDuePosts();
    return jsonOk({ published });
  } catch (err) {
    console.error('[cron/publish-scheduled]', err);
    return jsonError('Erro ao publicar posts agendados', 500);
  }
}