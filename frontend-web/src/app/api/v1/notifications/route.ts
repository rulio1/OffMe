import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import {
  getUnreadCount,
  listNotifications,
  markAllRead,
  toApiNotification,
} from '@/lib/notification-repository';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const notifications = await listNotifications(user.id);
    const unreadCount = await getUnreadCount(user.id);

    return jsonOk({
      notifications: notifications.map(toApiNotification),
      unreadCount,
    });
  } catch (err) {
    console.error('[notifications/list]', err);
    return jsonError('Erro ao carregar notificações', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    await markAllRead(user.id);
    return jsonOk({ ok: true });
  } catch (err) {
    console.error('[notifications/read]', err);
    return jsonError('Erro ao marcar notificações', 500);
  }
}