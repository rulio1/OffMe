import { query, queryOne } from './db';

export type FeedbackCategory = 'bug' | 'idea' | 'general';

export interface DbFeedback {
  id: number;
  user_id: number | null;
  category: FeedbackCategory;
  message: string;
  page_url: string | null;
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

export async function listFeedback(limit = 50): Promise<DbFeedback[]> {
  return query<DbFeedback>(
    `SELECT f.id, f.user_id, f.category, f.message, f.page_url, f.created_at,
            u.username, u.display_name
     FROM beta_feedback f
     LEFT JOIN users u ON u.id = f.user_id
     ORDER BY f.created_at DESC
     LIMIT $1`,
    [limit]
  );
}