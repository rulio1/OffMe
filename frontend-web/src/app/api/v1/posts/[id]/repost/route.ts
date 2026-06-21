import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { createNotification } from '@/lib/notification-repository';
import { getRequestUser } from '@/lib/request-auth';
import { repostPost, unrepostPost } from '@/lib/repost-repository';
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

    const newlyReposted = await repostPost(user.id, postId);
    if (newlyReposted) {
      await createNotification({
        userId: post.author_id,
        actorId: user.id,
        type: 'repost',
        postId,
      });
    }

    const updated = await queryOne<{ repost_count: number }>(
      `SELECT repost_count FROM posts WHERE id = $1`,
      [postId]
    );

    return jsonOk({
      postId,
      repostCount: updated?.repost_count ?? 0,
      repostedByMe: true,
    });
  } catch (err) {
    console.error('[posts/repost]', err);
    return jsonError('Erro ao repostar', 500);
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

    await unrepostPost(user.id, postId);

    const updated = await queryOne<{ repost_count: number }>(
      `SELECT repost_count FROM posts WHERE id = $1`,
      [postId]
    );

    return jsonOk({
      postId,
      repostCount: updated?.repost_count ?? 0,
      repostedByMe: false,
    });
  } catch (err) {
    console.error('[posts/unrepost]', err);
    return jsonError('Erro ao remover repost', 500);
  }
}