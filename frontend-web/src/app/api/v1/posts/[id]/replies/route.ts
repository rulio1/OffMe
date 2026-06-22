import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { enrichTimelineEntries } from '@/lib/post-enrichment';
import { findPostById, listReplies } from '@/lib/post-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const viewer = await getRequestUser(request);
    if (!viewer) return jsonError('Não autenticado', 401);

    const postId = Number(params.id);
    if (!Number.isFinite(postId)) return jsonError('Post inválido', 400);

    const post = await findPostById(postId, viewer.id);
    if (!post) return jsonError('Post não encontrado', 404);

    const cursor = request.nextUrl.searchParams.get('cursor') ?? undefined;
    const { rows, nextCursor } = await listReplies(postId, cursor, undefined, viewer.id);
    const entries = await enrichTimelineEntries(rows, viewer.id, 'following');

    return jsonOk({ entries, nextCursor });
  } catch (err) {
    console.error('[posts/replies]', err);
    return jsonError('Erro ao carregar respostas', 500);
  }
}