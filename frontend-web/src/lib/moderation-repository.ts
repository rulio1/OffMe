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