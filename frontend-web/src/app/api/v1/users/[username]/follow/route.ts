import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { followUser, unfollowUser } from '@/lib/follow-repository';
import { createNotification } from '@/lib/notification-repository';
import { findUserByUsername, toPublicUser } from '@/lib/user-repository';

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const viewer = await getRequestUser(request);
    if (!viewer) return jsonError('Não autenticado', 401);

    const target = await findUserByUsername(params.username);
    if (!target) return jsonError('Usuário não encontrado', 404);
    if (target.id === viewer.id) return jsonError('Você não pode seguir a si mesmo', 400);

    const followed = await followUser(viewer.id, target.id);
    if (followed) {
      await createNotification({
        userId: target.id,
        actorId: viewer.id,
        type: 'follow',
      });
    }

    const updated = await findUserByUsername(params.username);
    if (!updated) return jsonError('Usuário não encontrado', 404);

    return jsonOk({ user: toPublicUser(updated, { isFollowing: true }) });
  } catch (err) {
    console.error('[users/follow]', err);
    return jsonError('Erro ao seguir usuário', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const viewer = await getRequestUser(request);
    if (!viewer) return jsonError('Não autenticado', 401);

    const target = await findUserByUsername(params.username);
    if (!target) return jsonError('Usuário não encontrado', 404);

    await unfollowUser(viewer.id, target.id);

    const updated = await findUserByUsername(params.username);
    if (!updated) return jsonError('Usuário não encontrado', 404);

    return jsonOk({ user: toPublicUser(updated, { isFollowing: false }) });
  } catch (err) {
    console.error('[users/unfollow]', err);
    return jsonError('Erro ao deixar de seguir', 500);
  }
}