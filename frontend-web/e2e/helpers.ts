import type { Page } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3000/api/v1';

export function uniqueUsername(prefix: string): string {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return `${prefix}${suffix}`.slice(0, 15);
}

export async function apiRegister(input: {
  username: string;
  email: string;
  password: string;
  displayName: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Register failed: ${res.status}`);
  }
  return res.json();
}

export async function apiLogin(identifier: string, password: string) {
  const value = identifier.trim().toLowerCase();
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: value, email: value, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Login failed: ${res.status}`);
  }
  return res.json();
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: { id: number; username: string; [key: string]: unknown };
}

/** Sets localStorage and cookies so middleware and client auth both work. */
export async function setAuthSession(page: Page, session: AuthSession): Promise<void> {
  await page.goto('/login');
  await page.evaluate(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('offme_token', accessToken);
      localStorage.setItem('offme_refresh', refreshToken);
      localStorage.setItem('offme_user', JSON.stringify(user));
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      const cookieSuffix = (maxAge: number) => `; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
      document.cookie = `offme_token=${encodeURIComponent(accessToken)}${cookieSuffix(60 * 60 * 24 * 7)}`;
      document.cookie = `offme_refresh=${encodeURIComponent(refreshToken)}${cookieSuffix(60 * 60 * 24 * 30)}`;
    },
    session
  );
}

/** @deprecated Use setAuthSession */
export const seedSession = setAuthSession;