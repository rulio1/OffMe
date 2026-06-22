import webpush from 'web-push';
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

export async function listPushTokensForUser(userId: number): Promise<DbPushToken[]> {
  return query<DbPushToken>(
    `SELECT id, user_id, platform, token, endpoint, keys
     FROM push_tokens WHERE user_id = $1`,
    [userId]
  );
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
      if (row.platform === 'web') {
        if (!vapidConfigured() || !row.endpoint) continue;
        webpush.setVapidDetails(
          getVapidSubject(),
          process.env.VAPID_PUBLIC_KEY!,
          process.env.VAPID_PRIVATE_KEY!
        );
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: row.keys as webpush.PushSubscription['keys'],
          },
          payload
        );
      } else {
        // iOS/Android: token stored for future FCM/APNs integration
        if (!process.env.FCM_SERVER_KEY) continue;
        await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            Authorization: `key=${process.env.FCM_SERVER_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: row.token,
            notification: { title: input.title, body: input.body },
            data: { url: input.url ?? '/notifications' },
          }),
        });
      }
    } catch {
      if (row.platform === 'web' && row.endpoint) {
        await query(`DELETE FROM push_tokens WHERE id = $1`, [row.id]);
      }
    }
  }
}