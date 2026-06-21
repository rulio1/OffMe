import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { enrichPost } from '@/lib/post-enrichment';
import { findPostById } from '@/lib/post-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const viewer = await getRequestUser(request);
    if (!viewer) return jsonError('Não autenticado', 401);

    const postId = Number(params.id);
    if (!Number.isFinite(postId)) return jsonError('Post inválido', 400);

    const row = await findPostById(postId);
    if (!row) return jsonError('Post não encontrado', 404);

    return jsonOk(await enrichPost(row, viewer.id));
  } catch (err) {
    console.error('[posts/get]', err);
    return jsonError('Erro ao carregar post', 500);
  }
}