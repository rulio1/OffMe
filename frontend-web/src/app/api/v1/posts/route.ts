import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { enrichPost } from '@/lib/post-enrichment';
import { createPost } from '@/lib/post-repository';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const body = await request.json();
    const text = String(body.text ?? '').trim();
    const replyToId = body.replyToId != null ? Number(body.replyToId) : undefined;
    const mediaIds = Array.isArray(body.mediaIds)
      ? body.mediaIds.map(String).filter(Boolean).slice(0, 4)
      : undefined;
    const hasMedia = (mediaIds?.length ?? 0) > 0;

    if (!text && !hasMedia) return jsonError('O post não pode estar vazio', 400);
    if (text.length > 280) return jsonError('Máximo de 280 caracteres', 400);

    const post = await createPost(user.id, text, replyToId, mediaIds);
    return jsonOk(await enrichPost(post, user.id), 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes('não encontrado')) {
      return jsonError(err.message, 404);
    }
    console.error('[posts/create]', err);
    return jsonError('Erro ao criar post', 500);
  }
}