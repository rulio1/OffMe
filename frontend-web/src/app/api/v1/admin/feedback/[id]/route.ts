import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { isAdminUser } from '@/lib/admin-auth';
import {
  updateFeedbackStatus,
  type FeedbackStatus,
} from '@/lib/feedback-repository';
import { getRequestUser } from '@/lib/request-auth';

const STATUSES = new Set<FeedbackStatus>(['open', 'resolved', 'dismissed']);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);
    if (!isAdminUser(user)) return jsonError('Acesso negado', 403);

    const id = Number(params.id);
    if (!Number.isFinite(id)) return jsonError('ID inválido', 400);

    const body = await request.json();
    const status = String(body.status ?? '') as FeedbackStatus;
    if (!STATUSES.has(status)) return jsonError('Status inválido', 400);

    const adminNote = body.adminNote != null ? String(body.adminNote).slice(0, 500) : undefined;
    const updated = await updateFeedbackStatus(id, status, adminNote);
    if (!updated) return jsonError('Feedback não encontrado', 404);

    return jsonOk({ id, status });
  } catch (err) {
    console.error('[admin/feedback/patch]', err);
    return jsonError('Erro ao atualizar feedback', 500);
  }
}