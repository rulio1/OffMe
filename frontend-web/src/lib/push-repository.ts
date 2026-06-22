import webpush from 'web-push';
import { sendApnsNotification } from './apns-client';
import { sendFcmNotification } from './fcm-client';
import { query, queryOne } from './db';

export type PushPlatform = 'web' | 'ios' | 'android';

export interface DbPushToken {
  id: number;
  user_id: number;
  platform: PushPlatform;
  token: string;
  endpoint: string | null;
  keys: { p256dh?: string; auth?: string } | null;
}

function vapidConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function getVapidSubject(): string {
  return process.env.VAPID_SUBJECT ?? 'mailto:admin@offme.app';
}

export async function registerPushToken(input: {
  userId: number;
  platform: PushPlatform;
  token: string;
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}): Promise<void> {
  const token = input.token.trim();
  if (!token) throw new Error('Token inválido');

  await query(
    `INSERT INTO push_tokens (user_id, platform, token, endpoint, keys)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, token) DO UPDATE
       SET platform = EXCLUDED.platform,
           endpoint = EXCLUDED.endpoint,
           keys = EXCLUDED.keys`,
    [
      input.userId,
      input.platform,
      token,
      input.endpoint ?? null,
      input.keys ? JSON.stringify(input.keys) : null,
    ]
  );
}

export async function unregisterPushToken(userId: number, token: string): Promise<boolean> {
  const row = await queryOne<{ id: number }>(
    `DELETE FROM push_tokens WHERE user_id = $1 AND token = $2 RETURNING id`,
    [userId, token]
  );
  return Boolean(row);
}

export async function deletePushTokenById(id: number): Promise<void> {
  await query(`DELETE FROM push_tokens WHERE id = $1`, [id]);
}

export async function listPushTokensForUser(userId: number): Promise<DbPushToken[]> {
  return query<DbPushToken>(
    `SELECT id, user_id, platform, token, endpoint, keys
     FROM push_tokens WHERE user_id = $1`,
    [userId]
  );
}

async function sendWebPush(
  row: DbPushToken,
  payload: string
): Promise<{ ok: boolean; shouldRemoveToken: boolean }> {
  if (!vapidConfigured() || !row.endpoint) {
    return { ok: false, shouldRemoveToken: false };
  }

  webpush.setVapidDetails(
    getVapidSubject(),
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  try {
    await webpush.sendNotification(
      {
        endpoint: row.endpoint,
        keys: row.keys as webpush.PushSubscription['keys'],
      },
      payload
    );
    return { ok: true, shouldRemoveToken: false };
  } catch (err) {
    const statusCode =
      err && typeof err === 'object' && 'statusCode' in err
        ? Number((err as { statusCode?: number }).statusCode)
        : 0;
    return { ok: false, shouldRemoveToken: statusCode === 404 || statusCode === 410 };
  }
}

export async function dispatchPush(input: {
  userId: number;
  title: string;
  body: string;
  url?: string;
}): Promise<void> {
  const tokens = await listPushTokensForUser(input.userId);
  if (tokens.length === 0) return;

  const payload = JSON.stringify({
    title: input.title,
    body: input.body,
    url: input.url ?? '/notifications',
  });

  for (const row of tokens) {
    try {
      let result: { ok: boolean; shouldRemoveToken: boolean };

      if (row.platform === 'web') {
        result = await sendWebPush(row, payload);
      } else if (row.platform === 'ios') {
        const apns = await sendApnsNotification({
          deviceToken: row.token,
          title: input.title,
          body: input.body,
          url: input.url,
        });
        result = { ok: apns.ok, shouldRemoveToken: apns.shouldRemoveToken };
      } else {
        result = await sendFcmNotification({
          deviceToken: row.token,
          title: input.title,
          body: input.body,
          url: input.url,
        });
      }

      if (result.shouldRemoveToken) {
        await deletePushTokenById(row.id);
      }
    } catch {
      // best-effort per token
    }
  }
}