import { encodeCursor, PAGE_SIZE, parseCursor } from './cursor';
import { query, queryOne } from './db';
import { findUserById, findUserByUsername, toPublicUser, type DbUser } from './user-repository';

export interface DbConversationListItem {
  id: number;
  updated_at: Date;
  participant_id: number;
  participant_username: string;
  participant_display_name: string;
  participant_avatar_url: string | null;
  participant_verified: boolean;
  last_message_text: string | null;
  last_message_at: Date | null;
  last_message_sender_id: number | null;
}

export interface DbDirectMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  text: string;
  created_at: Date;
}

function participantFromRow(row: DbConversationListItem) {
  return toPublicUser({
    id: row.participant_id,
    public_id: '',
    username: row.participant_username,
    email: '',
    password_hash: '',
    display_name: row.participant_display_name,
    bio: '',
    avatar_url: row.participant_avatar_url,
    banner_url: null,
    verified: row.participant_verified,
    follower_count: 0,
    following_count: 0,
    created_at: row.updated_at,
  });
}

export function toApiConversation(row: DbConversationListItem) {
  return {
    id: row.id,
    participant: participantFromRow(row),
    updatedAt: (row.last_message_at ?? row.updated_at).getTime(),
    lastMessage: row.last_message_text
      ? {
          text: row.last_message_text,
          createdAt: row.last_message_at!.getTime(),
          senderId: row.last_message_sender_id!,
        }
      : undefined,
  };
}

export function toApiMessage(row: DbDirectMessage, viewerId: number) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    text: row.text,
    createdAt: row.created_at.getTime(),
    isMine: row.sender_id === viewerId,
  };
}

export async function isConversationMember(
  conversationId: number,
  userId: number
): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM conversation_members
       WHERE conversation_id = $1 AND user_id = $2
     ) AS exists`,
    [conversationId, userId]
  );
  return row?.exists ?? false;
}

export async function findConversationBetween(
  userId: number,
  otherUserId: number
): Promise<number | null> {
  const row = await queryOne<{ id: number }>(
    `SELECT c.id
     FROM conversations c
     JOIN conversation_members m1 ON m1.conversation_id = c.id AND m1.user_id = $1
     JOIN conversation_members m2 ON m2.conversation_id = c.id AND m2.user_id = $2
     WHERE (SELECT COUNT(*) FROM conversation_members m WHERE m.conversation_id = c.id) = 2
     LIMIT 1`,
    [userId, otherUserId]
  );
  return row?.id ?? null;
}

export async function getOrCreateConversation(
  userId: number,
  otherUserId: number
): Promise<number> {
  if (userId === otherUserId) throw new Error('Não é possível conversar consigo mesmo');

  const existing = await findConversationBetween(userId, otherUserId);
  if (existing) return existing;

  const created = await queryOne<{ id: number }>(
    `INSERT INTO conversations DEFAULT VALUES RETURNING id`
  );
  if (!created) throw new Error('Failed to create conversation');

  await query(
    `INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
    [created.id, userId, otherUserId]
  );

  return created.id;
}

export async function listConversations(userId: number): Promise<DbConversationListItem[]> {
  return query<DbConversationListItem>(
    `SELECT c.id, c.updated_at,
            u.id AS participant_id,
            u.username AS participant_username,
            u.display_name AS participant_display_name,
            u.avatar_url AS participant_avatar_url,
            u.verified AS participant_verified,
            lm.text AS last_message_text,
            lm.created_at AS last_message_at,
            lm.sender_id AS last_message_sender_id
     FROM conversations c
     JOIN conversation_members me ON me.conversation_id = c.id AND me.user_id = $1
     JOIN conversation_members them ON them.conversation_id = c.id AND them.user_id <> $1
     JOIN users u ON u.id = them.user_id
     LEFT JOIN LATERAL (
       SELECT dm.text, dm.created_at, dm.sender_id
       FROM direct_messages dm
       WHERE dm.conversation_id = c.id
       ORDER BY dm.created_at DESC
       LIMIT 1
     ) lm ON TRUE
     WHERE u.deactivated_at IS NULL
     ORDER BY COALESCE(lm.created_at, c.updated_at) DESC`,
    [userId]
  );
}

export async function getConversationListItem(
  conversationId: number,
  userId: number
): Promise<DbConversationListItem | null> {
  return queryOne<DbConversationListItem>(
    `SELECT c.id, c.updated_at,
            u.id AS participant_id,
            u.username AS participant_username,
            u.display_name AS participant_display_name,
            u.avatar_url AS participant_avatar_url,
            u.verified AS participant_verified,
            lm.text AS last_message_text,
            lm.created_at AS last_message_at,
            lm.sender_id AS last_message_sender_id
     FROM conversations c
     JOIN conversation_members me ON me.conversation_id = c.id AND me.user_id = $2
     JOIN conversation_members them ON them.conversation_id = c.id AND them.user_id <> $2
     JOIN users u ON u.id = them.user_id
     LEFT JOIN LATERAL (
       SELECT dm.text, dm.created_at, dm.sender_id
       FROM direct_messages dm
       WHERE dm.conversation_id = c.id
       ORDER BY dm.created_at DESC
       LIMIT 1
     ) lm ON TRUE
     WHERE c.id = $1 AND u.deactivated_at IS NULL`,
    [conversationId, userId]
  );
}

export async function listMessages(
  conversationId: number,
  beforeCursor?: string,
  limit = PAGE_SIZE
): Promise<{ rows: DbDirectMessage[]; nextCursor?: string }> {
  const parsed = beforeCursor ? parseCursor(beforeCursor) : null;
  const filterSql = parsed ? ` AND (dm.created_at, dm.id) < ($3, $4)` : '';
  const params: (number | Date)[] = parsed
    ? [conversationId, limit, parsed.createdAt, parsed.id]
    : [conversationId, limit];

  const rows = await query<DbDirectMessage>(
    `SELECT sub.id, sub.conversation_id, sub.sender_id, sub.text, sub.created_at
     FROM (
       SELECT dm.id, dm.conversation_id, dm.sender_id, dm.text, dm.created_at
       FROM direct_messages dm
       WHERE dm.conversation_id = $1${filterSql}
       ORDER BY dm.created_at DESC, dm.id DESC
       LIMIT $2
     ) sub
     ORDER BY sub.created_at ASC, sub.id ASC`,
    params
  );

  const oldest = rows[0];
  return {
    rows,
    nextCursor:
      rows.length === limit && oldest
        ? encodeCursor(oldest.created_at, oldest.id)
        : undefined,
  };
}

export async function sendMessage(
  conversationId: number,
  senderId: number,
  text: string
): Promise<DbDirectMessage> {
  const row = await queryOne<DbDirectMessage>(
    `INSERT INTO direct_messages (conversation_id, sender_id, text)
     VALUES ($1, $2, $3)
     RETURNING id, conversation_id, sender_id, text, created_at`,
    [conversationId, senderId, text]
  );
  if (!row) throw new Error('Failed to send message');

  await query(`UPDATE conversations SET updated_at = NOW() WHERE id = $1`, [conversationId]);
  return row;
}

export async function resolveOtherUser(
  username: string
): Promise<DbUser | null> {
  return findUserByUsername(username);
}

export async function resolveUserById(id: number): Promise<DbUser | null> {
  return findUserById(id);
}