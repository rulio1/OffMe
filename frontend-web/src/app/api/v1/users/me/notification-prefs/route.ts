import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import {
  getNotificationPrefs,
  updateNotificationPrefs,
} from '@/lib/notification-prefs-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);
    const prefs = await getNotificationPrefs(user.id);
    return jsonOk({ prefs });
  } catch (err) {
    console.error('[notification-prefs/get]', err);
    return jsonError('Erro ao carregar preferências', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const body = await request.json();
    const prefs = await updateNotificationPrefs(user.id, {
      ...(body.pushLikes !== undefined ? { pushLikes: Boolean(body.pushLikes) } : {}),
      ...(body.pushReplies !== undefined ? { pushReplies: Boolean(body.pushReplies) } : {}),
      ...(body.pushFollows !== undefined ? { pushFollows: Boolean(body.pushFollows) } : {}),
      ...(body.pushReposts !== undefined ? { pushReposts: Boolean(body.pushReposts) } : {}),
      ...(body.pushQuotes !== undefined ? { pushQuotes: Boolean(body.pushQuotes) } : {}),
      ...(body.pushDm !== undefined ? { pushDm: Boolean(body.pushDm) } : {}),
      ...(body.emailDigest !== undefined ? { emailDigest: Boolean(body.emailDigest) } : {}),
    });

    return jsonOk({ prefs });
  } catch (err) {
    console.error('[notification-prefs/patch]', err);
    return jsonError('Erro ao salvar preferências', 500);
  }
}