import { query, queryOne } from './db';

export interface DbPollOption {
  id: number;
  position: number;
  label: string;
  vote_count: number;
}

export interface DbPoll {
  post_id: number;
  duration_secs: number;
  ends_at: Date;
  total_votes: number;
  options: DbPollOption[];
  votedOptionId?: number;
}

const DEFAULT_DURATION_SECS = 86_400;

export async function createPoll(
  postId: number,
  options: string[],
  durationSecs = DEFAULT_DURATION_SECS
): Promise<void> {
  if (options.length < 2 || options.length > 4) {
    throw new Error('Enquete deve ter entre 2 e 4 opções');
  }

  const endsAt = new Date(Date.now() + durationSecs * 1000);

  await query(
    `INSERT INTO polls (post_id, duration_secs, ends_at) VALUES ($1, $2, $3)`,
    [postId, durationSecs, endsAt]
  );

  for (let i = 0; i < options.length; i++) {
    const label = options[i].trim();
    if (!label || label.length > 25) {
      throw new Error('Cada opção deve ter entre 1 e 25 caracteres');
    }
    await query(
      `INSERT INTO poll_options (post_id, position, label) VALUES ($1, $2, $3)`,
      [postId, i, label]
    );
  }
}

export async function getPollByPostId(postId: number, viewerId?: number): Promise<DbPoll | null> {
  const poll = await queryOne<{
    post_id: number;
    duration_secs: number;
    ends_at: Date;
    total_votes: number;
  }>(`SELECT post_id, duration_secs, ends_at, total_votes FROM polls WHERE post_id = $1`, [
    postId,
  ]);
  if (!poll) return null;

  const options = await query<DbPollOption>(
    `SELECT id, position, label, vote_count
     FROM poll_options WHERE post_id = $1 ORDER BY position ASC`,
    [postId]
  );

  let votedOptionId: number | undefined;
  if (viewerId != null) {
    const vote = await queryOne<{ option_id: number }>(
      `SELECT option_id FROM poll_votes WHERE user_id = $1 AND post_id = $2`,
      [viewerId, postId]
    );
    votedOptionId = vote?.option_id;
  }

  return { ...poll, options, votedOptionId };
}

export async function votePoll(
  userId: number,
  postId: number,
  optionId: number
): Promise<DbPoll> {
  const poll = await queryOne<{ ends_at: Date }>(
    `SELECT ends_at FROM polls WHERE post_id = $1`,
    [postId]
  );
  if (!poll) throw new Error('Enquete não encontrada');
  if (poll.ends_at.getTime() < Date.now()) throw new Error('Enquete encerrada');

  const option = await queryOne<{ id: number; post_id: number }>(
    `SELECT id, post_id FROM poll_options WHERE id = $1 AND post_id = $2`,
    [optionId, postId]
  );
  if (!option) throw new Error('Opção inválida');

  const existing = await queryOne<{ option_id: number }>(
    `SELECT option_id FROM poll_votes WHERE user_id = $1 AND post_id = $2`,
    [userId, postId]
  );

  if (existing) {
    if (existing.option_id === optionId) {
      const result = await getPollByPostId(postId, userId);
      if (!result) throw new Error('Enquete não encontrada');
      return result;
    }
    await query(`UPDATE poll_options SET vote_count = vote_count - 1 WHERE id = $1`, [
      existing.option_id,
    ]);
    await query(
      `UPDATE poll_votes SET option_id = $1, created_at = NOW() WHERE user_id = $2 AND post_id = $3`,
      [optionId, userId, postId]
    );
  } else {
    await query(
      `INSERT INTO poll_votes (user_id, post_id, option_id) VALUES ($1, $2, $3)`,
      [userId, postId, optionId]
    );
    await query(`UPDATE polls SET total_votes = total_votes + 1 WHERE post_id = $1`, [postId]);
  }

  await query(`UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = $1`, [optionId]);

  const result = await getPollByPostId(postId, userId);
  if (!result) throw new Error('Enquete não encontrada');
  return result;
}

export function toApiPoll(poll: DbPoll) {
  const ended = poll.ends_at.getTime() < Date.now();
  return {
    postId: Number(poll.post_id),
    durationSecs: poll.duration_secs,
    endsAt: poll.ends_at.getTime(),
    totalVotes: poll.total_votes,
    ended,
    votedOptionId: poll.votedOptionId,
    options: poll.options.map((o) => ({
      id: Number(o.id),
      position: o.position,
      label: o.label,
      voteCount: o.vote_count,
    })),
  };
}