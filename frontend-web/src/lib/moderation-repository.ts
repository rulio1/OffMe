import { query, queryOne } from './db';

export async function blockUser(blockerId: number, blockedId: number): Promise<void> {
  if (blockerId === blockedId) throw new Error('Não é possível bloquear a si mesmo');
  await query(
    `INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [blockerId, blockedId]
  );
}

export async function unblockUser(blockerId: number, blockedId: number): Promise<void> {
  await query(`DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2`, [
    blockerId,
    blockedId,
  ]);
}

export async function muteUser(muterId: number, mutedId: number): Promise<void> {
  if (muterId === mutedId) throw new Error('Não é possível silenciar a si mesmo');
  await query(
    `INSERT INTO mutes (muter_id, muted_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [muterId, mutedId]
  );
}

export async function unmuteUser(muterId: number, mutedId: number): Promise<void> {
  await query(`DELETE FROM mutes WHERE muter_id = $1 AND muted_id = $2`, [muterId, mutedId]);
}

export interface ModerationUserRow {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
  verified: boolean;
  created_at: Date;
}

export async function listBlockedUsers(blockerId: number): Promise<ModerationUserRow[]> {
  return query<ModerationUserRow>(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, u.verified, b.created_at
     FROM blocks b
     JOIN users u ON u.id = b.blocked_id
     WHERE b.blocker_id = $1 AND u.deactivated_at IS NULL
     ORDER BY b.created_at DESC`,
    [blockerId]
  );
}

export async function listMutedUsers(muterId: number): Promise<ModerationUserRow[]> {
  return query<ModerationUserRow>(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, u.verified, m.created_at
     FROM mutes m
     JOIN users u ON u.id = m.muted_id
     WHERE m.muter_id = $1 AND u.deactivated_at IS NULL
     ORDER BY m.created_at DESC`,
    [muterId]
  );
}

export async function isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM blocks WHERE blocker_id = $1 AND blocked_id = $2
     ) AS exists`,
    [blockerId, blockedId]
  );
  return Boolean(row?.exists);
}

export async function createReport(input: {
  reporterId: number;
  targetType: 'post' | 'user';
  targetId: number;
  reason: string;
}): Promise<{ id: number }> {
  const reason = input.reason.trim();
  if (!reason) throw new Error('Motivo é obrigatório');
  if (reason.length > 50) throw new Error('Motivo deve ter no máximo 50 caracteres');

  const row = await queryOne<{ id: number }>(
    `INSERT INTO reports (reporter_id, target_type, target_id, reason)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [input.reporterId, input.targetType, input.targetId, reason]
  );
  if (!row) throw new Error('Falha ao criar denúncia');
  return row;
}

export interface DbReport {
  id: number;
  reporter_id: number;
  target_type: 'post' | 'user';
  target_id: number;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: Date;
  reporter_username: string;
  reporter_display_name: string;
  post_text?: string | null;
  post_author_username?: string | null;
  target_username?: string | null;
  target_display_name?: string | null;
  target_suspended?: boolean | null;
}

export async function listOpenReports(limit = 50): Promise<DbReport[]> {
  return query<DbReport>(
    `SELECT r.id, r.reporter_id, r.target_type, r.target_id, r.reason, r.status, r.created_at,
            ru.username AS reporter_username, ru.display_name AS reporter_display_name,
            p.text AS post_text, au.username AS post_author_username,
            tu.username AS target_username, tu.display_name AS target_display_name,
            (tu.deactivated_at IS NOT NULL) AS target_suspended
     FROM reports r
     JOIN users ru ON ru.id = r.reporter_id
     LEFT JOIN posts p ON r.target_type = 'post' AND p.id = r.target_id
     LEFT JOIN users au ON p.author_id = au.id
     LEFT JOIN users tu ON r.target_type = 'user' AND tu.id = r.target_id
     WHERE r.status = 'open'
     ORDER BY r.created_at DESC
     LIMIT $1`,
    [limit]
  );
}

export async function updateReportStatus(
  reportId: number,
  status: 'resolved' | 'dismissed'
): Promise<boolean> {
  const row = await queryOne<{ id: number }>(
    `UPDATE reports
     SET status = $2, resolved_at = NOW()
     WHERE id = $1 AND status = 'open'
     RETURNING id`,
    [reportId, status]
  );
  return Boolean(row);
}