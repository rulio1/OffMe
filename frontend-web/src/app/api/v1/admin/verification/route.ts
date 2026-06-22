import { NextRequest } from 'next/server';
import { isAdminUser } from '@/lib/admin-auth';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { listPendingVerificationRequests } from '@/lib/verification-repository';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);
    if (!isAdminUser(user)) return jsonError('Acesso negado', 403);

    const requests = await listPendingVerificationRequests();
    return jsonOk({
      requests: requests.map((r) => ({
        id: Number(r.id),
        userId: Number(r.user_id),
        username: r.username,
        displayName: r.display_name,
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at.getTime(),
      })),
    });
  } catch (err) {
    console.error('[admin/verification]', err);
    return jsonError('Erro ao carregar solicitações', 500);
  }
}