import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { registerPushToken, type PushPlatform } from '@/lib/push-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const body = await request.json();
    const platform = String(body.platform ?? 'web') as PushPlatform;
    if (!['web', 'ios', 'android'].includes(platform)) {
      return jsonError('Plataforma inválida', 400);
    }

    const token = String(body.token ?? '').trim();
    if (!token) return jsonError('Token é obrigatório', 400);

    await registerPushToken({
      userId: user.id,
      platform,
      token,
      endpoint: body.endpoint ? String(body.endpoint) : undefined,
      keys: body.keys,
    });

    return jsonOk({ registered: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Token')) {
      return jsonError(err.message, 400);
    }
    console.error('[push/register]', err);
    return jsonError('Erro ao registrar push', 500);
  }
}