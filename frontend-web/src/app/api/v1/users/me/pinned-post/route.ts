import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { setPinnedPost } from '@/lib/user-repository';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const body = await request.json();
    const postId = body.postId == null ? null : Number(body.postId);
    if (postId != null && !Number.isFinite(postId)) {
      return jsonError('postId inválido', 400);
    }

    const ok = await setPinnedPost(user.id, postId);
    if (!ok) return jsonError('Post não encontrado ou não é seu', 400);

    return jsonOk({ pinnedPostId: postId });
  } catch (err) {
    console.error('[users/me/pinned-post]', err);
    return jsonError('Erro ao fixar post', 500);
  }
}