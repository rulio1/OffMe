import { NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/api-guard';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getTrendingTopics } from '@/lib/trending-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, 'trending-topics', 60);
  if (limited) return limited;

  try {
    const viewer = await getRequestUser(request);
    if (!viewer) return jsonError('Não autenticado', 401);

    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 10), 20);
    const topics = await getTrendingTopics(limit);
    return jsonOk({ topics });
  } catch (err) {
    console.error('[trending/topics]', err);
    return jsonError('Erro ao carregar trending', 500);
  }
}