import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { blockUser, unblockUser } from '@/lib/moderation-repository';
import { findUserByUsername } from '@/lib/user-repository';

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const target = await findUserByUsername(params.username);
    if (!target) return jsonError('Usuário não encontrado', 404);

    await blockUser(user.id, target.id);
    return jsonOk({ blocked: true, userId: target.id });
  } catch (err) {
    if (err instanceof Error && err.message.includes('bloquear')) {
      return jsonError(err.message, 400);
    }
    console.error('[users/block]', err);
    return jsonError('Erro ao bloquear usuário', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const target = await findUserByUsername(params.username);
    if (!target) return jsonError('Usuário não encontrado', 404);

    await unblockUser(user.id, target.id);
    return jsonOk({ blocked: false, userId: target.id });
  } catch (err) {
    console.error('[users/unblock]', err);
    return jsonError('Erro ao desbloquear usuário', 500);
  }
}