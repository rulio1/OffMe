import { NextRequest } from 'next/server';
import { isAdminUser } from '@/lib/admin-auth';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { reviewVerificationRequest } from '@/lib/verification-repository';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);
    if (!isAdminUser(user)) return jsonError('Acesso negado', 403);

    const requestId = Number(params.id);
    if (!Number.isFinite(requestId)) return jsonError('Solicitação inválida', 400);

    const body = await request.json();
    const action = String(body.action ?? '').trim();

    if (action !== 'approve' && action !== 'reject') {
      return jsonError('Ação inválida. Use approve ou reject.', 400);
    }

    const updated = await reviewVerificationRequest({
      requestId,
      reviewerId: user.id,
      action,
    });
    if (!updated) return jsonError('Solicitação não encontrada ou já processada', 404);

    return jsonOk({ updated: true, action });
  } catch (err) {
    console.error('[admin/verification/patch]', err);
    return jsonError('Erro ao revisar solicitação', 500);
  }
}