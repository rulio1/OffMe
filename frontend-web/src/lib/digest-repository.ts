import { query, queryOne } from './db';

export interface DigestRecipient {
  userId: number;
  email: string;
  displayName: string;
  username: string;
}

export interface DigestStats {
  unreadNotifications: number;
  newFollowers: number;
}

export async function listDigestRecipients(limit = 200): Promise<DigestRecipient[]> {
  return query<DigestRecipient>(
    `SELECT u.id AS "userId", u.email, u.display_name AS "displayName", u.username
     FROM users u
     LEFT JOIN user_notification_prefs p ON p.user_id = u.id
     WHERE u.deactivated_at IS NULL
       AND COALESCE(p.email_digest, TRUE) = TRUE
       AND (p.last_digest_at IS NULL OR p.last_digest_at < NOW() - INTERVAL '6 days')
     ORDER BY u.id
     LIMIT $1`,
    [limit]
  );
}

export async function getDigestStats(userId: number): Promise<DigestStats> {
  const unread = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM notifications
     WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );

  const followers = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM notifications
     WHERE user_id = $1
       AND type = 'follow'
       AND created_at > NOW() - INTERVAL '7 days'`,
    [userId]
  );

  return {
    unreadNotifications: Number(unread?.count ?? 0),
    newFollowers: Number(followers?.count ?? 0),
  };
}

export async function markDigestSent(userId: number): Promise<void> {
  await query(
    `INSERT INTO user_notification_prefs (user_id, last_digest_at, updated_at)
     VALUES ($1, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       last_digest_at = NOW(),
       updated_at = NOW()`,
    [userId]
  );
}

export async function sendWeeklyDigests(): Promise<{ sent: number; skipped: number }> {
  const { sendWeeklyDigestEmail } = await import('./email');
  const recipients = await listDigestRecipients(200);
  let sent = 0;
  let skipped = 0;

  for (const recipient of recipients) {
    const stats = await getDigestStats(recipient.userId);
    if (stats.unreadNotifications === 0 && stats.newFollowers === 0) {
      skipped += 1;
      await markDigestSent(recipient.userId);
      continue;
    }

    const ok = await sendWeeklyDigestEmail({
      to: recipient.email,
      displayName: recipient.displayName,
      username: recipient.username,
      stats,
    });

    if (ok) {
      sent += 1;
      await markDigestSent(recipient.userId);
    } else {
      skipped += 1;
    }
  }

  return { sent, skipped };
}