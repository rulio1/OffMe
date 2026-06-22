import { query, queryOne } from './db';

export type FeedbackCategory = 'bug' | 'idea' | 'general';
export type FeedbackStatus = 'open' | 'resolved' | 'dismissed';

export interface DbFeedback {
  id: number;
  user_id: number | null;
  category: FeedbackCategory;
  message: string;
  page_url: string | null;
  status: FeedbackStatus;
  admin_note: string | null;
  created_at: Date;
  username: string | null;
  display_name: string | null;
}

export async function createFeedback(input: {
  userId?: number;
  category: FeedbackCategory;
  message: string;
  pageUrl?: string;
}): Promise<{ id: number }> {
  const message = input.message.trim();
  if (message.length < 5 || message.length > 2000) {
    throw new Error('Mensagem deve ter entre 5 e 2000 caracteres');
  }

  const row = await queryOne<{ id: number }>(
    `INSERT INTO beta_feedback (user_id, category, message, page_url)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [input.userId ?? null, input.category, message, input.pageUrl ?? null]
  );
  if (!row) throw new Error('Falha ao salvar feedback');
  return row;
}

export async function listFeedback(
  limit = 50,
  status?: FeedbackStatus
): Promise<DbFeedback[]> {
  const params: (number | string)[] = [limit];
  let statusSql = '';
  if (status) {
    params.push(status);
    statusSql = ` WHERE f.status = $2`;
  }

  return query<DbFeedback>(
    `SELECT f.id, f.user_id, f.category, f.message, f.page_url,
            COALESCE(f.status, 'open') AS status, f.admin_note, f.created_at,
            u.username, u.display_name
     FROM beta_feedback f
     LEFT JOIN users u ON u.id = f.user_id
     ${statusSql}
     ORDER BY f.created_at DESC
     LIMIT $1`,
    params
  );
}

export async function updateFeedbackStatus(
  id: number,
  status: FeedbackStatus,
  adminNote?: string
): Promise<boolean> {
  const row = await queryOne<{ id: number }>(
    `UPDATE beta_feedback
     SET status = $2,
         admin_note = COALESCE($3, admin_note)
     WHERE id = $1
     RETURNING id`,
    [id, status, adminNote ?? null]
  );
  return !!row;
}

export function feedbackToCsv(rows: DbFeedback[]): string {
  const header = 'id,category,status,username,message,page_url,created_at,admin_note';
  const lines = rows.map((f) => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    return [
      f.id,
      f.category,
      f.status ?? 'open',
      esc(f.username ?? ''),
      esc(f.message),
      esc(f.page_url ?? ''),
      f.created_at.toISOString(),
      esc(f.admin_note ?? ''),
    ].join(',');
  });
  return [header, ...lines].join('\n');
}