import type { DbUser } from './user-repository';

export function getAdminUsernames(): string[] {
  const raw = process.env.ADMIN_USERNAMES ?? '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: Pick<DbUser, 'username'> & { is_admin?: boolean }): boolean {
  if (user.is_admin) return true;
  const admins = getAdminUsernames();
  return admins.includes(user.username.toLowerCase());
}