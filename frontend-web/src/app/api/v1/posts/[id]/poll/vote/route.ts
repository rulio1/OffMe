import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { toApiPoll, votePoll } from '@/lib/poll-repository';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const postId = Number(params.id);
    if (!Number.isFinite(postId)) return jsonError('Post inválido', 400);

    const body = await request.json();
    const optionId = Number(body.optionId);
    if (!Number.isFinite(optionId)) return jsonError('Opção inválida', 400);

    const poll = await votePoll(user.id, postId, optionId);
    return jsonOk({ poll: toApiPoll(poll) });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('Enquete') || err.message.includes('Opção')) {
        return jsonError(err.message, 400);
      }
    }
    console.error('[poll/vote]', err);
    return jsonError('Erro ao votar', 500);
  }
}