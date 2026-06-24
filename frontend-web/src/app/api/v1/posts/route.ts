import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { enrichPost } from '@/lib/post-enrichment';
import { createPoll } from '@/lib/poll-repository';
import { isCommunityMember } from '@/lib/community-repository';
import { createPost } from '@/lib/post-repository';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const body = await request.json();
    const text = String(body.text ?? '').trim();
    const replyToId = body.replyToId != null ? Number(body.replyToId) : undefined;
    const quoteOfId = body.quoteOfId != null ? Number(body.quoteOfId) : undefined;
    const mediaIds = Array.isArray(body.mediaIds)
      ? body.mediaIds.map(String).filter(Boolean).slice(0, 4)
      : undefined;
    const pollOptions = Array.isArray(body.pollOptions)
      ? body.pollOptions.map(String).filter((o: string) => o.trim()).slice(0, 4)
      : undefined;
    const scheduledAtRaw = body.scheduledAt != null ? String(body.scheduledAt) : undefined;
    const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : undefined;
    const hasMedia = (mediaIds?.length ?? 0) > 0;
    const hasPoll = (pollOptions?.length ?? 0) >= 2;

    if (!text && !hasMedia && !hasPoll) return jsonError('O post não pode estar vazio', 400);
    if (text.length > 280) return jsonError('Máximo de 280 caracteres', 400);
    if (replyToId != null && quoteOfId != null) {
      return jsonError('Não é possível responder e citar ao mesmo tempo', 400);
    }
    if (hasPoll && (hasMedia || quoteOfId != null)) {
      return jsonError('Enquete não pode ser combinada com mídia ou citação', 400);
    }
    if (scheduledAt && (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now())) {
      return jsonError('Data de agendamento deve ser no futuro', 400);
    }
    if (scheduledAt && (replyToId != null || quoteOfId != null)) {
      return jsonError('Respostas e citações não podem ser agendadas', 400);
    }

    const communityIdRaw = body.communityId != null ? Number(body.communityId) : undefined;
    let communityId: number | undefined;
    if (communityIdRaw != null) {
      if (!Number.isFinite(communityIdRaw)) {
        return jsonError('Comunidade inválida', 400);
      }
      const isMember = await isCommunityMember(communityIdRaw, user.id);
      if (!isMember) {
        return jsonError('Você precisa ser membro da comunidade para publicar', 403);
      }
      communityId = communityIdRaw;
    }

    const post = await createPost(user.id, text, replyToId, mediaIds, quoteOfId, {
      scheduledAt,
      communityId,
    });

    if (hasPoll && pollOptions) {
      await createPoll(post.id, pollOptions);
    }

    return jsonOk(await enrichPost(post, user.id), 201);
   } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('não encontrado')) return jsonError(err.message, 404);
      if (err.message.includes('Enquete') || err.message.includes('opção')) {
        return jsonError(err.message, 400);
      }
      // Log detailed error information for debugging
      console.error('[posts/create] Detailed error:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      return jsonError('Erro ao criar post: ' + err.message, 500);
    }
    console.error('[posts/create] Unknown error:', err);
    return jsonError('Erro desconhecido ao criar post', 500);
  }
}