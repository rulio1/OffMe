import { NextRequest } from 'next/server';
import { isAdminUser } from '@/lib/admin-auth';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { suspendUser, unsuspendUser } from '@/lib/user-repository';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getRequestUser(request);
    if (!admin) return jsonError('Não autenticado', 401);
    if (!isAdminUser(admin)) return jsonError('Acesso negado', 403);

    const userId = Number(params.id);
    if (!Number.isFinite(userId)) return jsonError('Usuário inválido', 400);

    const body = await request.json();
    const action = String(body.action ?? '');

    if (action === 'suspend') {
      const reason = String(body.reason ?? 'Violação das regras').trim();
      const ok = await suspendUser(userId, admin.id, reason);
      if (!ok) return jsonError('Usuário não encontrado ou já suspenso', 404);
      return jsonOk({ suspended: true, userId });
    }

    if (action === 'unsuspend') {
      const ok = await unsuspendUser(userId);
      if (!ok) return jsonError('Usuário não encontrado ou não está suspenso', 404);
      return jsonOk({ unsuspended: true, userId });
    }

    return jsonError('Ação inválida', 400);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Motivo')) {
      return jsonError(err.message, 400);
    }
    console.error('[admin/users]', err);
    return jsonError('Erro ao atualizar usuário', 500);
  }
}