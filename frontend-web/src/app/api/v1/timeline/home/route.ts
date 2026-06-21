import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { listFollowing } from '@/lib/post-repository';
import { enrichTimelineEntries } from '@/lib/post-enrichment';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const cursor = request.nextUrl.searchParams.get('cursor') ?? undefined;
    const { rows, nextCursor } = await listFollowing(user.id, cursor);
    const entries = await enrichTimelineEntries(rows, user.id, 'following');
    return jsonOk({ entries, nextCursor });
  } catch (err) {
    console.error('[timeline/home]', err);
    return jsonError('Erro ao carregar timeline', 500);
  }
}