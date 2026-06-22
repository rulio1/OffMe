import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { toApiPost, listScheduledPosts } from '@/lib/post-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const rows = await listScheduledPosts(user.id);
    return jsonOk({
      posts: rows.map((row) =>
        toApiPost(row, { scheduledAt: row.scheduled_at, status: row.status })
      ),
    });
  } catch (err) {
    console.error('[posts/scheduled]', err);
    return jsonError('Erro ao carregar posts agendados', 500);
  }
}