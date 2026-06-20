import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { extractBearerToken, verifyAccessToken } from '@/lib/auth-server';
import { findUserById, toPublicUser } from '@/lib/user-repository';

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return jsonError('Não autenticado', 401);

    const payload = verifyAccessToken(token);
    if (!payload) return jsonError('Token inválido ou expirado', 401);

    const user = await findUserById(Number(payload.sub));
    if (!user) return jsonError('Usuário não encontrado', 404);

    return jsonOk({ user: toPublicUser(user) });
  } catch (err) {
    console.error('[auth/me]', err);
    return jsonError('Erro interno', 500);
  }
}