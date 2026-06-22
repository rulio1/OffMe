import { query, queryOne } from './db';
import type { NotificationType } from './notification-repository';

export interface NotificationPrefs {
  pushLikes: boolean;
  pushReplies: boolean;
  pushFollows: boolean;
  pushReposts: boolean;
  pushQuotes: boolean;
  pushDm: boolean;
  emailDigest: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  pushLikes: true,
  pushReplies: true,
  pushFollows: true,
  pushReposts: true,
  pushQuotes: true,
  pushDm: true,
  emailDigest: true,
};

function rowToPrefs(row: {
  push_likes: boolean;
  push_replies: boolean;
  push_follows: boolean;
  push_reposts: boolean;
  push_quotes: boolean;
  push_dm: boolean;
  email_digest?: boolean;
}): NotificationPrefs {
  return {
    pushLikes: row.push_likes,
    pushReplies: row.push_replies,
    pushFollows: row.push_follows,
    pushReposts: row.push_reposts,
    pushQuotes: row.push_quotes,
    pushDm: row.push_dm,
    emailDigest: row.email_digest ?? true,
  };
}

export async function getNotificationPrefs(userId: number): Promise<NotificationPrefs> {
  const row = await queryOne<{
    push_likes: boolean;
    push_replies: boolean;
    push_follows: boolean;
    push_reposts: boolean;
    push_quotes: boolean;
    push_dm: boolean;
    email_digest: boolean;
  }>(
    `SELECT push_likes, push_replies, push_follows, push_reposts, push_quotes, push_dm,
            COALESCE(email_digest, TRUE) AS email_digest
     FROM user_notification_prefs WHERE user_id = $1`,
    [userId]
  );
  return row ? rowToPrefs(row) : DEFAULT_PREFS;
}

export async function updateNotificationPrefs(
  userId: number,
  prefs: Partial<NotificationPrefs>
): Promise<NotificationPrefs> {
  const current = await getNotificationPrefs(userId);
  const next = { ...current, ...prefs };

  await query(
    `INSERT INTO user_notification_prefs (
       user_id, push_likes, push_replies, push_follows, push_reposts, push_quotes, push_dm,
       email_digest, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       push_likes = EXCLUDED.push_likes,
       push_replies = EXCLUDED.push_replies,
       push_follows = EXCLUDED.push_follows,
       push_reposts = EXCLUDED.push_reposts,
       push_quotes = EXCLUDED.push_quotes,
       push_dm = EXCLUDED.push_dm,
       email_digest = EXCLUDED.email_digest,
       updated_at = NOW()`,
    [
      userId,
      next.pushLikes,
      next.pushReplies,
      next.pushFollows,
      next.pushReposts,
      next.pushQuotes,
      next.pushDm,
      next.emailDigest,
    ]
  );

  return next;
}

export function shouldSendPush(type: NotificationType, prefs: NotificationPrefs): boolean {
  switch (type) {
    case 'like':
      return prefs.pushLikes;
    case 'reply':
      return prefs.pushReplies;
    case 'follow':
      return prefs.pushFollows;
    case 'repost':
      return prefs.pushReposts;
    case 'quote':
      return prefs.pushQuotes;
    case 'mention':
      return prefs.pushReplies;
    default:
      return true;
  }
}