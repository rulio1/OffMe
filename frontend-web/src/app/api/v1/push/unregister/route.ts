import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { unregisterPushToken } from '@/lib/push-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const body = await request.json().catch(() => ({}));
    const token = String(body.token ?? '').trim();
    if (!token) return jsonError('Token é obrigatório', 400);

    await unregisterPushToken(user.id, token);
    return jsonOk({ unregistered: true });
  } catch (err) {
    console.error('[push/unregister]', err);
    return jsonError('Erro ao remover push', 500);
  }
}