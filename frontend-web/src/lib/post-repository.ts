import type { Poll, Post } from '@/types';
import { query, queryOne } from './db';
import {
  encodeCursor,
  encodeForYouCursor,
  PAGE_SIZE,
  parseCursor,
  parseForYouCursor,
} from './cursor';
import { deleteMediaForPost, linkMediaToPost } from './media-repository';
import { createNotification } from './notification-repository';
import { toPublicUser, type DbUser } from './user-repository';

export interface DbPost {
  id: number;
  author_id: number;
  text: string;
  reply_to_id: number | null;
  quote_of_id: number | null;
  like_count: number;
  repost_count: number;
  reply_count: number;
  created_at: Date;
  username: string;
  display_name: string;
  avatar_url: string | null;
  verified: boolean;
}

export interface DbTimelineRow extends DbPost {
  timeline_source: 'following' | 'repost';
  timeline_at: Date;
  event_id: number;
}

const POST_SELECT = `
  SELECT p.id, p.author_id, p.text, p.reply_to_id, p.quote_of_id, p.like_count, p.repost_count,
         p.reply_count, p.created_at,
         u.username, u.display_name, u.avatar_url, u.verified
  FROM posts p
  JOIN users u ON u.id = p.author_id
`;

export interface PaginatedPosts {
  rows: DbPost[];
  nextCursor?: string;
}

function buildCursorClause(cursor: string | undefined, paramOffset: number): {
  sql: string;
  params: (Date | number)[];
} {
  if (!cursor) return { sql: '', params: [] };
  const parsed = parseCursor(cursor);
  if (!parsed) return { sql: '', params: [] };
  return {
    sql: ` AND (p.created_at, p.id) < ($${paramOffset}, $${paramOffset + 1})`,
    params: [parsed.createdAt, parsed.id],
  };
}

function buildForYouCursorClause(cursor: string | undefined, paramOffset: number): {
  sql: string;
  params: (Date | number)[];
} {
  if (!cursor) return { sql: '', params: [] };
  const parsed = parseForYouCursor(cursor);
  if (!parsed) return { sql: '', params: [] };
  return {
    sql: ` AND (score, created_at, id) < ($${paramOffset}, $${paramOffset + 1}, $${paramOffset + 2})`,
    params: [parsed.score, parsed.createdAt, parsed.id],
  };
}

/** Public reads: published only, unless viewer is the author. */
function publishedVisibilitySql(viewerId: number | undefined, paramOffset: number): {
  sql: string;
  params: number[];
} {
  if (viewerId == null) {
    return { sql: ` AND COALESCE(p.status, 'published') = 'published'`, params: [] };
  }
  return {
    sql: ` AND (COALESCE(p.status, 'published') = 'published' OR p.author_id = $${paramOffset})`,
    params: [viewerId],
  };
}

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export async function createPost(
  authorId: number,
  text: string,
  replyToId?: number,
  mediaIds?: string[],
  quoteOfId?: number,
  options?: { scheduledAt?: Date; communityId?: number }
): Promise<DbPost> {
  if (replyToId != null) {
    const parent = await queryOne<{ id: number; author_id: number }>(
      `SELECT id, author_id FROM posts WHERE id = $1`,
      [replyToId]
    );
    if (!parent) throw new Error('Post original não encontrado');
  }

  if (quoteOfId != null) {
    const quoted = await queryOne<{ id: number }>(
      `SELECT id FROM posts WHERE id = $1`,
      [quoteOfId]
    );
    if (!quoted) throw new Error('Post citado não encontrado');
  }

  const scheduledAt = options?.scheduledAt;
  const isScheduled = scheduledAt != null && scheduledAt.getTime() > Date.now();
  const status: PostStatus = isScheduled ? 'scheduled' : 'published';
  const communityId = options?.communityId ?? null;

  const inserted = await queryOne<{ id: number }>(
    `INSERT INTO posts (author_id, text, reply_to_id, quote_of_id, scheduled_at, published_at, status, community_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      authorId,
      text,
      replyToId ?? null,
      quoteOfId ?? null,
      isScheduled ? scheduledAt : null,
      isScheduled ? null : new Date(),
      status,
      communityId,
    ]
  );

  if (!inserted) throw new Error('Failed to create post');

  if (!isScheduled) {
    await query(
      `UPDATE users SET post_count = post_count + 1, updated_at = NOW() WHERE id = $1`,
      [authorId]
    );
  }

  if (!isScheduled && replyToId != null) {
    const parent = await queryOne<{ author_id: number }>(
      `SELECT author_id FROM posts WHERE id = $1`,
      [replyToId]
    );
    await query(`UPDATE posts SET reply_count = reply_count + 1 WHERE id = $1`, [replyToId]);
    if (parent) {
      await createNotification({
        userId: parent.author_id,
        actorId: authorId,
        type: 'reply',
        postId: inserted.id,
      });
    }
  } else if (!isScheduled && quoteOfId != null) {
    const quoted = await queryOne<{ author_id: number }>(
      `SELECT author_id FROM posts WHERE id = $1`,
      [quoteOfId]
    );
    if (quoted && quoted.author_id !== authorId) {
      await createNotification({
        userId: quoted.author_id,
        actorId: authorId,
        type: 'quote',
        postId: inserted.id,
      });
    }
  }

  if (mediaIds && mediaIds.length > 0) {
    await linkMediaToPost(mediaIds, inserted.id, authorId);
  }

  const row = await queryOne<DbPost>(`${POST_SELECT} WHERE p.id = $1`, [inserted.id]);
  if (!row) throw new Error('Failed to load post');
  return row;
}

export async function findPostById(id: number, viewerId?: number): Promise<DbPost | null> {
  const visibility = publishedVisibilitySql(viewerId, 2);
  return queryOne<DbPost>(
    `${POST_SELECT} WHERE p.id = $1 AND u.deactivated_at IS NULL${visibility.sql}`,
    [id, ...visibility.params]
  );
}

export interface DbScheduledPost extends DbPost {
  scheduled_at: Date;
  status: PostStatus;
}

export async function listScheduledPosts(authorId: number): Promise<DbScheduledPost[]> {
  return query<DbScheduledPost>(
    `${POST_SELECT}, p.scheduled_at, p.status
     WHERE p.author_id = $1 AND p.status = 'scheduled' AND u.deactivated_at IS NULL
     ORDER BY p.scheduled_at ASC`,
    [authorId]
  );
}

export async function updateScheduledPost(
  postId: number,
  authorId: number,
  input: { text?: string; scheduledAt?: Date }
): Promise<DbScheduledPost | null> {
  const existing = await queryOne<{ id: number; status: PostStatus }>(
    `SELECT id, status FROM posts WHERE id = $1 AND author_id = $2`,
    [postId, authorId]
  );
  if (!existing || existing.status !== 'scheduled') return null;

  const sets: string[] = [];
  const params: unknown[] = [postId, authorId];
  let idx = 3;

  if (input.text !== undefined) {
    const text = input.text.trim();
    if (text.length < 1 || text.length > 280) {
      throw new Error('Post deve ter entre 1 e 280 caracteres');
    }
    sets.push(`text = $${idx++}`);
    params.push(text);
  }

  if (input.scheduledAt !== undefined) {
    if (input.scheduledAt.getTime() <= Date.now()) {
      throw new Error('Data de agendamento deve ser no futuro');
    }
    sets.push(`scheduled_at = $${idx++}`);
    params.push(input.scheduledAt);
  }

  if (sets.length === 0) {
    return queryOne<DbScheduledPost>(
      `${POST_SELECT}, p.scheduled_at, p.status
       WHERE p.id = $1 AND p.author_id = $2`,
      [postId, authorId]
    );
  }

  const updated = await queryOne<{ id: number }>(
    `UPDATE posts SET ${sets.join(', ')}
     WHERE id = $1 AND author_id = $2 AND status = 'scheduled'
     RETURNING id`,
    params
  );
  if (!updated) return null;

  return queryOne<DbScheduledPost>(
    `${POST_SELECT}, p.scheduled_at, p.status
     WHERE p.id = $1 AND p.author_id = $2`,
    [postId, authorId]
  );
}

export async function deletePost(postId: number, authorId: number): Promise<boolean> {
  await deleteMediaForPost(postId);

  const row = await queryOne<{ id: number; reply_to_id: number | null; status: PostStatus }>(
    `DELETE FROM posts WHERE id = $1 AND author_id = $2 RETURNING id, reply_to_id, status`,
    [postId, authorId]
  );
  if (!row) return false;

  if (row.status === 'published') {
    await query(
      `UPDATE users SET post_count = GREATEST(post_count - 1, 0), updated_at = NOW() WHERE id = $1`,
      [authorId]
    );
  }

  if (row.reply_to_id != null) {
    await query(
      `UPDATE posts SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = $1`,
      [row.reply_to_id]
    );
  }

  return true;
}

export async function listReplies(
  postId: number,
  cursor?: string,
  limit = PAGE_SIZE,
  viewerId?: number
): Promise<PaginatedPosts> {
  const visibility = publishedVisibilitySql(viewerId, 3);
  const { sql, params } = buildCursorClause(cursor, 4);
  const rows = await query<DbPost>(
    `${POST_SELECT}
     WHERE p.reply_to_id = $1 AND u.deactivated_at IS NULL${visibility.sql}${sql}
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT $2`,
    [postId, limit, ...visibility.params, ...params]
  );

  const last = rows[rows.length - 1];
  return {
    rows,
    nextCursor:
      rows.length === limit && last ? encodeCursor(last.created_at, last.id) : undefined,
  };
}

const BLOCK_MUTE_FILTER = `
  AND u.deactivated_at IS NULL
  AND COALESCE(p.status, 'published') = 'published'
  AND p.author_id NOT IN (
    SELECT blocked_id FROM blocks WHERE blocker_id = $1
    UNION
    SELECT blocker_id FROM blocks WHERE blocked_id = $1
  )
  AND p.author_id NOT IN (
    SELECT muted_id FROM mutes WHERE muter_id = $1
  )
`;

export async function listForYou(
  viewerId: number,
  cursor?: string,
  limit = PAGE_SIZE
): Promise<PaginatedPosts> {
  const candidateLimit = 200;
  const followingLimit = Math.floor(candidateLimit * 0.4);
  const recentLimit = Math.floor(candidateLimit * 0.4);
  const trendingLimit = candidateLimit - followingLimit - recentLimit;

  const { sql, params } = buildForYouCursorClause(cursor, 3);

  type ScoredRow = DbPost & { score: number; in_network: number };

  const rows = await query<ScoredRow>(
    `WITH candidates AS (
       (
         SELECT p.id, p.author_id, p.text, p.reply_to_id, p.quote_of_id, p.like_count, p.repost_count,
                p.reply_count, p.created_at,
                u.username, u.display_name, u.avatar_url, u.verified,
                1::float AS in_network, p.created_at AS sort_at
         FROM posts p
         JOIN users u ON u.id = p.author_id
         WHERE p.reply_to_id IS NULL
           AND p.author_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
           ${BLOCK_MUTE_FILTER}
         ORDER BY p.created_at DESC, p.id DESC
         LIMIT ${followingLimit}
       )
       UNION ALL
       (
         SELECT p.id, p.author_id, p.text, p.reply_to_id, p.quote_of_id, p.like_count, p.repost_count,
                p.reply_count, p.created_at,
                u.username, u.display_name, u.avatar_url, u.verified,
                0::float AS in_network, p.created_at AS sort_at
         FROM posts p
         JOIN users u ON u.id = p.author_id
         WHERE p.reply_to_id IS NULL
           AND p.created_at >= NOW() - INTERVAL '7 days'
           ${BLOCK_MUTE_FILTER}
         ORDER BY p.created_at DESC, p.id DESC
         LIMIT ${recentLimit}
       )
       UNION ALL
       (
         SELECT p.id, p.author_id, p.text, p.reply_to_id, p.quote_of_id, p.like_count, p.repost_count,
                p.reply_count, p.created_at,
                u.username, u.display_name, u.avatar_url, u.verified,
                0::float AS in_network, p.created_at AS sort_at
         FROM posts p
         JOIN users u ON u.id = p.author_id
         WHERE p.reply_to_id IS NULL
           ${BLOCK_MUTE_FILTER}
         ORDER BY (p.like_count + p.repost_count * 2 + p.reply_count) DESC, p.created_at DESC
         LIMIT ${trendingLimit}
       )
     ),
     deduped AS (
       SELECT DISTINCT ON (id) *
       FROM candidates
       ORDER BY id, in_network DESC, sort_at DESC
     ),
     scored AS (
       SELECT *,
         (
           0.4 * in_network
           + 0.3 * LN(1 + GREATEST(like_count, 0))
           + 0.3 * EXP(-EXTRACT(EPOCH FROM (NOW() - created_at)) / 604800.0)
         ) AS score
       FROM deduped
     ),
     ranked AS (
       SELECT *,
         ROW_NUMBER() OVER (PARTITION BY author_id ORDER BY score DESC, created_at DESC, id DESC) AS author_rank
       FROM scored
     )
     SELECT id, author_id, text, reply_to_id, quote_of_id, like_count, repost_count,
            reply_count, created_at, username, display_name, avatar_url, verified, score, in_network
     FROM ranked
     WHERE author_rank <= 3${sql}
     ORDER BY score DESC, created_at DESC, id DESC
     LIMIT $2`,
    [viewerId, limit, ...params]
  );

  const last = rows[rows.length - 1];
  return {
    rows,
    nextCursor:
      rows.length === limit && last
        ? encodeForYouCursor(last.score, last.created_at, last.id)
        : undefined,
  };
}

export async function publishDuePosts(): Promise<number> {
  const due = await query<{ id: number; author_id: number; reply_to_id: number | null; quote_of_id: number | null }>(
    `UPDATE posts
     SET status = 'published', published_at = NOW()
     WHERE status = 'scheduled' AND scheduled_at <= NOW()
     RETURNING id, author_id, reply_to_id, quote_of_id`
  );

  for (const post of due) {
    await query(
      `UPDATE users SET post_count = post_count + 1, updated_at = NOW() WHERE id = $1`,
      [post.author_id]
    );

    if (post.reply_to_id != null) {
      const parent = await queryOne<{ author_id: number }>(
        `SELECT author_id FROM posts WHERE id = $1`,
        [post.reply_to_id]
      );
      await query(`UPDATE posts SET reply_count = reply_count + 1 WHERE id = $1`, [post.reply_to_id]);
      if (parent) {
        await createNotification({
          userId: parent.author_id,
          actorId: post.author_id,
          type: 'reply',
          postId: post.id,
        });
      }
    } else if (post.quote_of_id != null) {
      const quoted = await queryOne<{ author_id: number }>(
        `SELECT author_id FROM posts WHERE id = $1`,
        [post.quote_of_id]
      );
      if (quoted && quoted.author_id !== post.author_id) {
        await createNotification({
          userId: quoted.author_id,
          actorId: post.author_id,
          type: 'quote',
          postId: post.id,
        });
      }
    }
  }

  return due.length;
}

function buildTimelineCursorClause(cursor: string | undefined, paramOffset: number): {
  sql: string;
  params: (Date | number)[];
} {
  if (!cursor) return { sql: '', params: [] };
  const parsed = parseCursor(cursor);
  if (!parsed) return { sql: '', params: [] };
  return {
    sql: ` AND (timeline_at, event_id) < ($${paramOffset}, $${paramOffset + 1})`,
    params: [parsed.createdAt, parsed.id],
  };
}

const HOME_TIMELINE_SQL = `
  WITH following AS (
    SELECT $1::bigint AS user_id
    UNION
    SELECT following_id FROM follows WHERE follower_id = $1
  )
  SELECT p.id, p.author_id, p.text, p.reply_to_id, p.quote_of_id, p.like_count, p.repost_count,
         p.reply_count, p.created_at,
         u.username, u.display_name, u.avatar_url, u.verified,
         timeline_source, timeline_at, event_id
  FROM (
    SELECT p.id AS post_id, 'following'::text AS timeline_source,
           p.created_at AS timeline_at, p.id AS event_id
    FROM posts p
    WHERE p.author_id IN (SELECT user_id FROM following)
      AND COALESCE(p.status, 'published') = 'published'

    UNION ALL

    SELECT r.post_id, 'repost'::text AS timeline_source,
           r.created_at AS timeline_at,
           (r.user_id::bigint * 1000000000 + r.post_id) AS event_id
    FROM post_reposts r
    WHERE r.user_id IN (SELECT user_id FROM following)
  ) te
  JOIN posts p ON p.id = te.post_id
  JOIN users u ON u.id = p.author_id
  WHERE u.deactivated_at IS NULL
    AND COALESCE(p.status, 'published') = 'published'
`;

export async function listFollowing(
  userId: number,
  cursor?: string,
  limit = PAGE_SIZE
): Promise<{ rows: DbTimelineRow[]; nextCursor?: string }> {
  const { sql, params } = buildTimelineCursorClause(cursor, 3);
  const rows = await query<DbTimelineRow>(
    `${HOME_TIMELINE_SQL}${sql}
     ORDER BY timeline_at DESC, event_id DESC
     LIMIT $2`,
    [userId, limit, ...params]
  );

  const last = rows[rows.length - 1];
  return {
    rows,
    nextCursor:
      rows.length === limit && last
        ? encodeCursor(last.timeline_at, last.event_id)
        : undefined,
  };
}

function buildBookmarkCursorClause(cursor: string | undefined, paramOffset: number): {
  sql: string;
  params: (Date | number)[];
} {
  if (!cursor) return { sql: '', params: [] };
  const parsed = parseCursor(cursor);
  if (!parsed) return { sql: '', params: [] };
  return {
    sql: ` AND (b.created_at, p.id) < ($${paramOffset}, $${paramOffset + 1})`,
    params: [parsed.createdAt, parsed.id],
  };
}

export async function listBookmarks(
  userId: number,
  cursor?: string,
  limit = PAGE_SIZE
): Promise<PaginatedPosts> {
  const { sql, params } = buildBookmarkCursorClause(cursor, 3);
  const rows = await query<DbPost & { bookmarked_at: Date }>(
    `SELECT p.id, p.author_id, p.text, p.reply_to_id, p.quote_of_id, p.like_count, p.repost_count,
            p.reply_count, p.created_at,
            u.username, u.display_name, u.avatar_url, u.verified,
            b.created_at AS bookmarked_at
     FROM posts p
     JOIN users u ON u.id = p.author_id
     JOIN post_bookmarks b ON b.post_id = p.id AND b.user_id = $1
     WHERE u.deactivated_at IS NULL
       AND COALESCE(p.status, 'published') = 'published'${sql}
     ORDER BY b.created_at DESC, p.id DESC
     LIMIT $2`,
    [userId, limit, ...params]
  );

  const last = rows[rows.length - 1];
  return {
    rows,
    nextCursor:
      rows.length === limit && last
        ? encodeCursor(last.bookmarked_at, last.id)
        : undefined,
  };
}

export async function searchPosts(queryText: string, limit = 20): Promise<DbPost[]> {
  const term = queryText.trim();
  if (!term) return [];

  const pattern = `%${term}%`;
  return query<DbPost>(
    `${POST_SELECT}
     WHERE u.deactivated_at IS NULL
       AND COALESCE(p.status, 'published') = 'published'
       AND p.reply_to_id IS NULL
       AND (p.text ILIKE $1 OR u.username ILIKE $1 OR u.display_name ILIKE $1)
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT $2`,
    [pattern, limit]
  );
}

let trendingCache: { posts: DbPost[]; expiresAt: number } | null = null;
const TRENDING_TTL_MS = 120_000;

export async function getTrendingPosts(limit = 10): Promise<DbPost[]> {
  if (trendingCache && trendingCache.expiresAt > Date.now()) {
    return trendingCache.posts.slice(0, limit);
  }

  const posts = await query<DbPost>(
    `${POST_SELECT}
     WHERE u.deactivated_at IS NULL
       AND COALESCE(p.status, 'published') = 'published'
       AND p.reply_to_id IS NULL
       AND p.created_at > NOW() - INTERVAL '7 days'
     ORDER BY (p.like_count + p.repost_count * 2 + p.reply_count) DESC, p.created_at DESC
     LIMIT $1`,
    [limit]
  );

  trendingCache = { posts, expiresAt: Date.now() + TRENDING_TTL_MS };
  return posts;
}

export async function listByAuthor(
  authorId: number,
  cursor?: string,
  limit = PAGE_SIZE,
  viewerId?: number
): Promise<PaginatedPosts> {
  const isOwnProfile = viewerId != null && viewerId === authorId;
  const visibility = isOwnProfile
    ? { sql: '', params: [] as number[] }
    : publishedVisibilitySql(viewerId, 3);
  const cursorOffset = visibility.params.length > 0 ? 4 : 3;
  const { sql, params } = buildCursorClause(cursor, cursorOffset);
  const rows = await query<DbPost>(
    `${POST_SELECT}
     WHERE p.author_id = $1 AND u.deactivated_at IS NULL AND p.reply_to_id IS NULL${visibility.sql}${sql}
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT $2`,
    [authorId, limit, ...visibility.params, ...params]
  );

  const last = rows[rows.length - 1];
  return {
    rows,
    nextCursor:
      rows.length === limit && last ? encodeCursor(last.created_at, last.id) : undefined,
  };
}

export function toApiPost(
  row: DbPost,
  extra?: {
    likedByMe?: boolean;
    bookmarkedByMe?: boolean;
    repostedByMe?: boolean;
    mediaUrls?: string[];
    quotedPost?: Post;
    poll?: Poll;
    timelineSource?: 'following' | 'repost' | 'recommended';
    scheduledAt?: Date;
    status?: PostStatus;
  }
): Post {
  const author: DbUser = {
    id: Number(row.author_id),
    public_id: '',
    username: row.username,
    email: '',
    password_hash: '',
    display_name: row.display_name,
    bio: '',
    avatar_url: row.avatar_url,
    banner_url: null,
    location: null,
    website_url: null,
    verified: row.verified,
    follower_count: 0,
    following_count: 0,
    created_at: row.created_at,
  };

  return {
    id: Number(row.id),
    authorId: Number(row.author_id),
    author: toPublicUser(author),
    text: row.text,
    createdAt: row.created_at.getTime(),
    likeCount: row.like_count,
    repostCount: row.repost_count,
    replyCount: row.reply_count,
    replyToId: row.reply_to_id != null ? Number(row.reply_to_id) : undefined,
    quoteOfId: row.quote_of_id != null ? Number(row.quote_of_id) : undefined,
    ...(extra?.likedByMe != null ? { likedByMe: extra.likedByMe } : {}),
    ...(extra?.bookmarkedByMe != null ? { bookmarkedByMe: extra.bookmarkedByMe } : {}),
    ...(extra?.repostedByMe != null ? { repostedByMe: extra.repostedByMe } : {}),
    ...(extra?.mediaUrls && extra.mediaUrls.length > 0 ? { mediaUrls: extra.mediaUrls } : {}),
    ...(extra?.quotedPost ? { quotedPost: extra.quotedPost } : {}),
    ...(extra?.poll ? { poll: extra.poll } : {}),
    ...(extra?.timelineSource ? { timelineSource: extra.timelineSource } : {}),
    ...(extra?.scheduledAt ? { scheduledAt: extra.scheduledAt.getTime() } : {}),
    ...(extra?.status ? { status: extra.status } : {}),
  };
}

export function toTimelineEntry(
  row: DbPost,
  source: 'following' | 'repost' | 'recommended' = 'recommended',
  extra?: {
    likedByMe?: boolean;
    bookmarkedByMe?: boolean;
    repostedByMe?: boolean;
    mediaUrls?: string[];
    quotedPost?: Post;
    poll?: Poll;
    timelineSource?: 'following' | 'repost' | 'recommended';
  }
) {
  const entrySource = extra?.timelineSource ?? source;
  return {
    postId: Number(row.id),
    authorId: Number(row.author_id),
    source: entrySource,
    createdAt: row.created_at.getTime(),
    post: toApiPost(row, { ...extra, timelineSource: entrySource }),
  };
}