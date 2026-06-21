import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { likePost, unlikePost } from '@/lib/like-repository';
import { createNotification } from '@/lib/notification-repository';
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

    const post = await queryOne<{ id: number; author_id: number }>(
      `SELECT id, author_id FROM posts WHERE id = $1`,
      [postId]
    );
    if (!post) return jsonError('Post não encontrado', 404);

    const newlyLiked = await likePost(user.id, postId);
    if (newlyLiked) {
      await createNotification({
        userId: post.author_id,
        actorId: user.id,
        type: 'like',
        postId,
      });
    }

    const updated = await queryOne<{ like_count: number }>(
      `SELECT like_count FROM posts WHERE id = $1`,
      [postId]
    );

    return jsonOk({
      postId,
      likeCount: updated?.like_count ?? 0,
      likedByMe: true,
    });
  } catch (err) {
    console.error('[posts/like]', err);
    return jsonError('Erro ao curtir post', 500);
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

    await unlikePost(user.id, postId);

    const updated = await queryOne<{ like_count: number }>(
      `SELECT like_count FROM posts WHERE id = $1`,
      [postId]
    );

    return jsonOk({
      postId,
      likeCount: updated?.like_count ?? 0,
      likedByMe: false,
    });
  } catch (err) {
    console.error('[posts/unlike]', err);
    return jsonError('Erro ao remover curtida', 500);
  }
}