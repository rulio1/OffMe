import { query, queryOne } from './db';

export interface DbVerificationRequest {
  id: number;
  user_id: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  reviewed_at: Date | null;
  reviewed_by: number | null;
  username: string;
  display_name: string;
  verified: boolean;
}

export async function createVerificationRequest(
  userId: number,
  reason: string
): Promise<{ id: number }> {
  const trimmed = reason.trim();
  if (trimmed.length < 10) {
    throw new Error('Explique em pelo menos 10 caracteres por que deseja verificação');
  }
  if (trimmed.length > 500) {
    throw new Error('Motivo deve ter no máximo 500 caracteres');
  }

  const existing = await queryOne<{ id: number }>(
    `SELECT id FROM verification_requests WHERE user_id = $1 AND status = 'pending'`,
    [userId]
  );
  if (existing) throw new Error('Você já possui uma solicitação pendente');

  const user = await queryOne<{ verified: boolean }>(
    `SELECT verified FROM users WHERE id = $1`,
    [userId]
  );
  if (user?.verified) throw new Error('Sua conta já está verificada');

  const row = await queryOne<{ id: number }>(
    `INSERT INTO verification_requests (user_id, reason)
     VALUES ($1, $2)
     RETURNING id`,
    [userId, trimmed]
  );
  if (!row) throw new Error('Falha ao criar solicitação');
  return row;
}

export async function getLatestVerificationRequest(
  userId: number
): Promise<DbVerificationRequest | null> {
  return queryOne<DbVerificationRequest>(
    `SELECT vr.id, vr.user_id, vr.reason, vr.status, vr.created_at, vr.reviewed_at, vr.reviewed_by,
            u.username, u.display_name, u.verified
     FROM verification_requests vr
     JOIN users u ON u.id = vr.user_id
     WHERE vr.user_id = $1
     ORDER BY vr.created_at DESC
     LIMIT 1`,
    [userId]
  );
}

export async function listPendingVerificationRequests(
  limit = 50
): Promise<DbVerificationRequest[]> {
  return query<DbVerificationRequest>(
    `SELECT vr.id, vr.user_id, vr.reason, vr.status, vr.created_at, vr.reviewed_at, vr.reviewed_by,
            u.username, u.display_name, u.verified
     FROM verification_requests vr
     JOIN users u ON u.id = vr.user_id
     WHERE vr.status = 'pending'
     ORDER BY vr.created_at ASC
     LIMIT $1`,
    [limit]
  );
}

export async function reviewVerificationRequest(input: {
  requestId: number;
  reviewerId: number;
  action: 'approve' | 'reject';
}): Promise<boolean> {
  const status = input.action === 'approve' ? 'approved' : 'rejected';

  const row = await queryOne<{ user_id: number }>(
    `UPDATE verification_requests
     SET status = $2, reviewed_at = NOW(), reviewed_by = $3
     WHERE id = $1 AND status = 'pending'
     RETURNING user_id`,
    [input.requestId, status, input.reviewerId]
  );
  if (!row) return false;

  if (input.action === 'approve') {
    await query(`UPDATE users SET verified = TRUE, updated_at = NOW() WHERE id = $1`, [
      row.user_id,
    ]);
  }

  return true;
}