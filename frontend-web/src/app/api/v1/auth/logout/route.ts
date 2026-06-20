import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { revokeRefreshToken } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const refreshToken = String(body.refreshToken ?? '');

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    return jsonOk({ success: true });
  } catch (err) {
    console.error('[auth/logout]', err);
    return jsonError('Erro ao sair', 500);
  }
}