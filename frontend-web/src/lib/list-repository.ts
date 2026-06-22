import { query, queryOne } from './db';
import { toPublicUser, type DbUser } from './user-repository';

export interface DbList {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  is_private: boolean;
  created_at: Date;
  member_count?: number;
}

const PUBLIC_USER_SELECT = `u.id, u.public_id, u.username, u.display_name, u.bio,
  u.avatar_url, u.banner_url, u.location, u.website_url, u.verified, u.follower_count, u.following_count, u.created_at`;

export async function createList(
  ownerId: number,
  name: string,
  description?: string,
  isPrivate = false
): Promise<DbList> {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 50) {
    throw new Error('Nome da lista deve ter entre 1 e 50 caracteres');
  }

  const row = await queryOne<DbList>(
    `INSERT INTO lists (owner_id, name, description, is_private)
     VALUES ($1, $2, $3, $4)
     RETURNING id, owner_id, name, description, is_private, created_at`,
    [ownerId, trimmed, description?.trim() || null, isPrivate]
  );
  if (!row) throw new Error('Falha ao criar lista');
  return row;
}

export async function listListsForUser(userId: number): Promise<DbList[]> {
  return query<DbList & { member_count: number }>(
    `SELECT l.id, l.owner_id, l.name, l.description, l.is_private, l.created_at,
            (SELECT COUNT(*)::int FROM list_members lm WHERE lm.list_id = l.id) AS member_count
     FROM lists l
     WHERE l.owner_id = $1
     ORDER BY l.created_at DESC`,
    [userId]
  );
}

export async function findListById(listId: number, viewerId: number): Promise<DbList | null> {
  return queryOne<DbList & { member_count: number }>(
    `SELECT l.id, l.owner_id, l.name, l.description, l.is_private, l.created_at,
            (SELECT COUNT(*)::int FROM list_members lm WHERE lm.list_id = l.id) AS member_count
     FROM lists l
     WHERE l.id = $1 AND (l.owner_id = $2 OR l.is_private = FALSE)`,
    [listId, viewerId]
  );
}

export async function addListMember(
  listId: number,
  ownerId: number,
  memberUserId: number
): Promise<boolean> {
  const list = await queryOne<{ owner_id: number }>(
    `SELECT owner_id FROM lists WHERE id = $1`,
    [listId]
  );
  if (!list || list.owner_id !== ownerId) return false;

  await query(
    `INSERT INTO list_members (list_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [listId, memberUserId]
  );
  return true;
}

export async function listMembers(
  listId: number,
  viewerId: number
): Promise<ReturnType<typeof toPublicUser>[]> {
  const list = await findListById(listId, viewerId);
  if (!list) throw new Error('Lista não encontrada');

  const rows = await query<DbUser>(
    `SELECT ${PUBLIC_USER_SELECT}
     FROM list_members lm
     JOIN users u ON u.id = lm.user_id
     WHERE lm.list_id = $1 AND u.deactivated_at IS NULL
     ORDER BY lm.added_at ASC`,
    [listId]
  );
  return rows.map((u) => toPublicUser({ ...u, email: '', password_hash: '' }));
}

export function toApiList(row: DbList & { member_count?: number }) {
  return {
    id: Number(row.id),
    ownerId: Number(row.owner_id),
    name: row.name,
    description: row.description ?? undefined,
    isPrivate: row.is_private,
    memberCount: Number(row.member_count ?? 0),
    createdAt: row.created_at.getTime(),
  };
}