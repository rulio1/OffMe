import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { muteUser, unmuteUser } from '@/lib/moderation-repository';
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

    await muteUser(user.id, target.id);
    return jsonOk({ muted: true, userId: target.id });
  } catch (err) {
    if (err instanceof Error && err.message.includes('silenciar')) {
      return jsonError(err.message, 400);
    }
    console.error('[users/mute]', err);
    return jsonError('Erro ao silenciar usuário', 500);
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

    await unmuteUser(user.id, target.id);
    return jsonOk({ muted: false, userId: target.id });
  } catch (err) {
    console.error('[users/unmute]', err);
    return jsonError('Erro ao remover silêncio', 500);
  }
}