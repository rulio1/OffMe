import { NextRequest } from 'next/server';
import { isAdminUser } from '@/lib/admin-auth';
import { jsonError, jsonOk } from '@/lib/api-response';
import { updateReportStatus } from '@/lib/moderation-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);
    if (!isAdminUser(user)) return jsonError('Acesso negado', 403);

    const reportId = Number(params.id);
    if (!Number.isFinite(reportId)) return jsonError('Denúncia inválida', 400);

    const body = await request.json();
    const action = String(body.action ?? '').trim();

    if (action !== 'resolve' && action !== 'dismiss') {
      return jsonError('Ação inválida. Use resolve ou dismiss.', 400);
    }

    const status = action === 'resolve' ? 'resolved' : 'dismissed';
    const updated = await updateReportStatus(reportId, status);
    if (!updated) return jsonError('Denúncia não encontrada ou já processada', 404);

    return jsonOk({ updated: true, status });
  } catch (err) {
    console.error('[admin/reports/patch]', err);
    return jsonError('Erro ao atualizar denúncia', 500);
  }
}