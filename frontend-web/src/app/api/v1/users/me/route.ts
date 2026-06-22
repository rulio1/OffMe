import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { deactivateOwnAccount, toPublicUser, updateUserProfile } from '@/lib/user-repository';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const body = await request.json();
    const input: {
      displayName?: string;
      bio?: string;
      avatarUrl?: string | null;
      bannerUrl?: string | null;
      location?: string | null;
      websiteUrl?: string | null;
    } = {};

    if (body.displayName !== undefined) input.displayName = String(body.displayName);
    if (body.bio !== undefined) input.bio = String(body.bio);
    if (body.avatarUrl !== undefined) {
      input.avatarUrl = body.avatarUrl == null ? null : String(body.avatarUrl);
    }
    if (body.bannerUrl !== undefined) {
      input.bannerUrl = body.bannerUrl == null ? null : String(body.bannerUrl);
    }
    if (body.location !== undefined) {
      input.location = body.location == null ? null : String(body.location);
    }
    if (body.websiteUrl !== undefined) {
      input.websiteUrl = body.websiteUrl == null ? null : String(body.websiteUrl);
    }

    const updated = await updateUserProfile(user.id, input);
    if (!updated) return jsonError('Usuário não encontrado', 404);

    return jsonOk({ user: toPublicUser(updated) });
  } catch (err) {
    if (err instanceof Error && err.message.includes('caracteres')) {
      return jsonError(err.message, 400);
    }
    console.error('[users/me/update]', err);
    return jsonError('Erro ao atualizar perfil', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const deleted = await deactivateOwnAccount(user.id);
    if (!deleted) return jsonError('Conta não encontrada', 404);

    return jsonOk({ deactivated: true });
  } catch (err) {
    console.error('[users/me/delete]', err);
    return jsonError('Erro ao excluir conta', 500);
  }
}