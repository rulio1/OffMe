import { query, queryOne } from './db';
import { encodeCursor, PAGE_SIZE, parseCursor } from './cursor';
import type { DbPost } from './post-repository';
import { toPublicUser, type DbUser } from './user-repository';

export interface DbCommunity {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  creator_id: number | null;
  created_at: Date;
  member_count?: number;
}

const POST_SELECT = `
  SELECT p.id, p.author_id, p.text, p.reply_to_id, p.quote_of_id, p.like_count, p.repost_count,
         p.reply_count, p.created_at,
         u.username, u.display_name, u.avatar_url, u.verified
  FROM posts p
  JOIN users u ON u.id = p.author_id
`;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export async function createCommunity(
  creatorId: number,
  name: string,
  description?: string
): Promise<DbCommunity> {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 50) {
    throw new Error('Nome da comunidade deve ter entre 2 e 50 caracteres');
  }

  let slug = slugify(trimmed);
  if (slug.length < 2) slug = `c-${Date.now()}`;

  const existing = await queryOne<{ id: number }>(
    `SELECT id FROM communities WHERE slug = $1`,
    [slug]
  );
  if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const row = await queryOne<DbCommunity>(
    `INSERT INTO communities (slug, name, description, creator_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, slug, name, description, creator_id, created_at`,
    [slug, trimmed, description?.trim() || null, creatorId]
  );
  if (!row) throw new Error('Falha ao criar comunidade');

  await query(
    `INSERT INTO community_members (community_id, user_id, role)
     VALUES ($1, $2, 'admin') ON CONFLICT DO NOTHING`,
    [row.id, creatorId]
  );

  return row;
}

export async function listCommunities(limit = 50): Promise<DbCommunity[]> {
  return query<DbCommunity & { member_count: number }>(
    `SELECT c.id, c.slug, c.name, c.description, c.creator_id, c.created_at,
            (SELECT COUNT(*)::int FROM community_members cm WHERE cm.community_id = c.id) AS member_count
     FROM communities c
     ORDER BY c.created_at DESC
     LIMIT $1`,
    [limit]
  );
}

export async function findCommunityBySlug(slug: string): Promise<DbCommunity | null> {
  return queryOne<DbCommunity & { member_count: number }>(
    `SELECT c.id, c.slug, c.name, c.description, c.creator_id, c.created_at,
            (SELECT COUNT(*)::int FROM community_members cm WHERE cm.community_id = c.id) AS member_count
     FROM communities c
     WHERE c.slug = $1`,
    [slug]
  );
}

export async function isCommunityMember(communityId: number, userId: number): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2
     ) AS exists`,
    [communityId, userId]
  );
  return Boolean(row?.exists);
}

export async function joinCommunity(communityId: number, userId: number): Promise<void> {
  await query(
    `INSERT INTO community_members (community_id, user_id, role)
     VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`,
    [communityId, userId]
  );
}

export async function listCommunityTimeline(
  communityId: number,
  cursor?: string,
  limit = PAGE_SIZE
): Promise<{ rows: DbPost[]; nextCursor?: string }> {
  let sql = '';
  const params: (Date | number)[] = [communityId, limit];

  if (cursor) {
    const parsed = parseCursor(cursor);
    if (parsed) {
      sql = ` AND (p.created_at, p.id) < ($3, $4)`;
      params.push(parsed.createdAt, parsed.id);
    }
  }

  const rows = await query<DbPost>(
    `${POST_SELECT}
     WHERE p.community_id = $1
       AND u.deactivated_at IS NULL
       AND COALESCE(p.status, 'published') = 'published'${sql}
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT $2`,
    params
  );

  const last = rows[rows.length - 1];
  return {
    rows,
    nextCursor:
      rows.length === limit && last ? encodeCursor(last.created_at, last.id) : undefined,
  };
}

export function toApiCommunity(row: DbCommunity & { member_count?: number }) {
  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    creatorId: row.creator_id != null ? Number(row.creator_id) : undefined,
    memberCount: Number(row.member_count ?? 0),
    createdAt: row.created_at.getTime(),
  };
}