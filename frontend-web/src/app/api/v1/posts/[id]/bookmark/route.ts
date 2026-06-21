import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { bookmarkPost, unbookmarkPost } from '@/lib/bookmark-repository';
import { getRequestUser } from '@/lib/request-auth';
import { queryOne } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const postId = Number(params.id);
    if (!Number.isFinite(postId)) return jsonError('Post inválido', 400);

    const post = await queryOne<{ id: number }>(`SELECT id FROM posts WHERE id = $1`, [postId]);
    if (!post) return jsonError('Post não encontrado', 404);

    await bookmarkPost(user.id, postId);
    return jsonOk({ postId, bookmarkedByMe: true });
  } catch (err) {
    console.error('[posts/bookmark]', err);
    return jsonError('Erro ao salvar post', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const postId = Number(params.id);
    if (!Number.isFinite(postId)) return jsonError('Post inválido', 400);

    await unbookmarkPost(user.id, postId);
    return jsonOk({ postId, bookmarkedByMe: false });
  } catch (err) {
    console.error('[posts/unbookmark]', err);
    return jsonError('Erro ao remover dos salvos', 500);
  }
}