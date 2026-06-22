import { queryOne } from './db';

export async function getPostOgData(postId: number) {
  return queryOne<{
    text: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  }>(
    `SELECT p.text, u.username, u.display_name, u.avatar_url
     FROM posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.id = $1
       AND u.deactivated_at IS NULL
       AND COALESCE(p.status, 'published') = 'published'`,
    [postId]
  );
}

export async function getProfileOgData(username: string) {
  return queryOne<{
    username: string;
    display_name: string;
    bio: string;
    avatar_url: string | null;
    verified: boolean;
  }>(
    `SELECT username, display_name, bio, avatar_url, verified
     FROM users
     WHERE LOWER(username) = LOWER($1) AND deactivated_at IS NULL`,
    [username]
  );
}