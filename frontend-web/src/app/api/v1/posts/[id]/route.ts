import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { enrichPost } from '@/lib/post-enrichment';
import { deletePost, findPostById, toApiPost, updateScheduledPost } from '@/lib/post-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const viewer = await getRequestUser(request);

    const postId = Number(params.id);
    if (!Number.isFinite(postId)) return jsonError('Post inválido', 400);

    const row = await findPostById(postId, viewer?.id);
    if (!row) return jsonError('Post não encontrado', 404);

    return jsonOk(await enrichPost(row, viewer?.id));
  } catch (err) {
    console.error('[posts/get]', err);
    return jsonError('Erro ao carregar post', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const postId = Number(params.id);
    if (!Number.isFinite(postId)) return jsonError('Post inválido', 400);

    const body = await request.json();
    const input: { text?: string; scheduledAt?: Date } = {};

    if (body.text !== undefined) input.text = String(body.text);
    if (body.scheduledAt !== undefined) {
      const scheduledAt = new Date(String(body.scheduledAt));
      if (Number.isNaN(scheduledAt.getTime())) {
        return jsonError('Data de agendamento inválida', 400);
      }
      input.scheduledAt = scheduledAt;
    }

    const updated = await updateScheduledPost(postId, user.id, input);
    if (!updated) return jsonError('Post agendado não encontrado', 404);

    return jsonOk(
      toApiPost(updated, { scheduledAt: updated.scheduled_at, status: updated.status })
    );
  } catch (err) {
    if (err instanceof Error && (err.message.includes('caracteres') || err.message.includes('futuro'))) {
      return jsonError(err.message, 400);
    }
    console.error('[posts/patch]', err);
    return jsonError('Erro ao atualizar post', 500);
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