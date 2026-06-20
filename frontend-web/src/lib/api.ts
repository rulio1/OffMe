import type { TimelineResponse, Post, User } from '@/types';
import { getToken, getRefreshToken, getStoredUser, type AuthSession } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const user = getStoredUser();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (user) headers['X-User-Id'] = String(user.id);
  return headers;
}

async function parseError(res: Response, fallback: string): Promise<never> {
  const err = await res.json().catch(() => ({}));
  throw new Error(err.message || fallback);
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) await parseError(res, 'E-mail ou senha inválidos');

  const data = await res.json();
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: normalizeUser(data.user),
  };
}

export async function register(
  username: string,
  email: string,
  password: string,
  displayName: string
): Promise<AuthSession> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, displayName }),
  });

  if (!res.ok) await parseError(res, 'Não foi possível criar a conta');

  const data = await res.json();
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: normalizeUser(data.user),
  };
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {});
}

export async function fetchCurrentUser(): Promise<User | null> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  return normalizeUser(data.user);
}

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: Number(raw.id),
    username: String(raw.username),
    displayName: String(raw.displayName ?? raw.display_name ?? raw.username),
    avatarUrl: raw.avatarUrl ? String(raw.avatarUrl) : undefined,
    verified: Boolean(raw.verified),
    bio: raw.bio ? String(raw.bio) : undefined,
    followerCount: raw.followerCount != null ? Number(raw.followerCount) : undefined,
    followingCount: raw.followingCount != null ? Number(raw.followingCount) : undefined,
  };
}

export async function fetchHomeTimeline(cursor?: string): Promise<TimelineResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`${API_BASE}/timeline/home?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}

export async function fetchForYouTimeline(cursor?: string): Promise<TimelineResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`${API_BASE}/timeline/for-you?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch For You timeline');
  return res.json();
}

export async function createPost(text: string, replyToId?: number): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ text, replyToId }),
  });
  if (!res.ok) throw new Error('Failed to create post');
  return res.json();
}