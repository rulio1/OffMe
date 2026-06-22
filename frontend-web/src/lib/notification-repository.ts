import { query, queryOne } from './db';

export type NotificationType = 'like' | 'reply' | 'follow' | 'repost' | 'quote';

export interface DbNotification {
  id: number;
  user_id: number;
  actor_id: number;
  type: NotificationType;
  post_id: number | null;
  read_at: Date | null;
  created_at: Date;
  actor_username: string;
  actor_display_name: string;
  actor_avatar_url: string | null;
  actor_verified: boolean;
}

const NOTIFICATION_SELECT = `
  SELECT n.id, n.user_id, n.actor_id, n.type, n.post_id, n.read_at, n.created_at,
         u.username AS actor_username, u.display_name AS actor_display_name,
         u.avatar_url AS actor_avatar_url, u.verified AS actor_verified
  FROM notifications n
  JOIN users u ON u.id = n.actor_id
`;

export async function createNotification(input: {
  userId: number;
  actorId: number;
  type: NotificationType;
  postId?: number;
}): Promise<void> {
  if (input.userId === input.actorId) return;

  await query(
    `INSERT INTO notifications (user_id, actor_id, type, post_id)
     VALUES ($1, $2, $3, $4)`,
    [input.userId, input.actorId, input.type, input.postId ?? null]
  );
}

export async function listNotifications(userId: number, limit = 50): Promise<DbNotification[]> {
  return query<DbNotification>(
    `${NOTIFICATION_SELECT}
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
}

export async function getUnreadCount(userId: number): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return Number(row?.count ?? 0);
}

export async function markAllRead(userId: number): Promise<void> {
  await query(
    `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
}

export function toApiNotification(row: DbNotification) {
  return {
    id: row.id,
    type: row.type,
    postId: row.post_id ?? undefined,
    read: row.read_at != null,
    createdAt: row.created_at.getTime(),
    actor: {
      id: row.actor_id,
      username: row.actor_username,
      displayName: row.actor_display_name,
      avatarUrl: row.actor_avatar_url ?? '',
      verified: row.actor_verified,
    },
  };
}