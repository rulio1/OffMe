import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { listBlockedUsers } from '@/lib/moderation-repository';
import { getRequestUser } from '@/lib/request-auth';
import { toPublicUser } from '@/lib/user-repository';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const rows = await listBlockedUsers(user.id);
    return jsonOk({
      users: rows.map((row) => ({
        ...toPublicUser({
          id: row.id,
          public_id: '',
          username: row.username,
          email: '',
          password_hash: '',
          display_name: row.display_name,
          bio: '',
          avatar_url: row.avatar_url,
          banner_url: null,
          location: null,
          website_url: null,
          verified: row.verified,
          follower_count: 0,
          following_count: 0,
          created_at: row.created_at,
        }),
        blockedAt: row.created_at.getTime(),
      })),
    });
  } catch (err) {
    console.error('[users/me/blocks]', err);
    return jsonError('Erro ao carregar bloqueados', 500);
  }
}