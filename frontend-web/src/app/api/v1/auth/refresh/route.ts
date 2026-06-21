import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { refreshAuthTokens } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refreshToken = String(body.refreshToken ?? '').trim();

    if (!refreshToken) {
      return jsonError('Refresh token ausente', 400);
    }

    const tokens = await refreshAuthTokens(refreshToken);
    if (!tokens) {
      return jsonError('Sessão expirada', 401);
    }

    return jsonOk(tokens);
  } catch (err) {
    console.error('[auth/refresh]', err);
    return jsonError('Erro interno ao renovar sessão', 500);
  }
}