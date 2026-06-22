import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { enrichPost } from '@/lib/post-enrichment';
import { deletePost, findPostById } from '@/lib/post-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const viewer = await getRequestUser(request);
    if (!viewer) return jsonError('Não autenticado', 401);

    const postId = Number(params.id);
    if (!Number.isFinite(postId)) return jsonError('Post inválido', 400);

    const row = await findPostById(postId, viewer.id);
    if (!row) return jsonError('Post não encontrado', 404);

    return jsonOk(await enrichPost(row, viewer.id));
  } catch (err) {
    console.error('[posts/get]', err);
    return jsonError('Erro ao carregar post', 500);
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

    const deleted = await deletePost(postId, user.id);
    if (!deleted) return jsonError('Post não encontrado ou sem permissão', 404);

    return jsonOk({ deleted: true, postId });
  } catch (err) {
    console.error('[posts/delete]', err);
    return jsonError('Erro ao excluir post', 500);
  }
}