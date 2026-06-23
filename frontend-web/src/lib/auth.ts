import type { User } from '@/types';

const TOKEN_KEY = 'offme_token';
const REFRESH_KEY = 'offme_refresh';
const USER_KEY = 'offme_user';
const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

function cookieSuffix(maxAge: number): string {
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  return `; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}${cookieSuffix(maxAge)}`;
}

function clearCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, bufferSeconds = 30): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    if (!payload.exp) return true;
    return Date.now() >= payload.exp * 1000 - bufferSeconds * 1000;
  } catch {
    return true;
  }
}

export function syncSessionCookies(): void {
  const token = getToken();
  const refresh = getRefreshToken();
  if (token) setCookie('offme_token', token, ACCESS_COOKIE_MAX_AGE);
  if (refresh) setCookie('offme_refresh', refresh, REFRESH_COOKIE_MAX_AGE);
}

export function setSession(session: AuthSession): void {
  localStorage.setItem(TOKEN_KEY, session.accessToken);
  localStorage.setItem(REFRESH_KEY, session.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  setCookie('offme_token', session.accessToken, ACCESS_COOKIE_MAX_AGE);
  setCookie('offme_refresh', session.refreshToken, REFRESH_COOKIE_MAX_AGE);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  clearCookie('offme_token');
  clearCookie('offme_refresh');
}

export function isAuthenticated(): boolean {
  return !!getToken() || !!getRefreshToken();
}

export function updateStoredUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('offme:user-change'));
}
