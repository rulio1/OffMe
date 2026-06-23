'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  clearSession,
  getRefreshToken,
  getToken,
  isTokenExpired,
  syncSessionCookies,
  updateStoredUser,
} from '@/lib/auth';
import { bootstrapSession, fetchCurrentUser } from '@/lib/api';

const AUTH_PATHS = ['/login', '/signup'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const token = getToken();
      const refresh = getRefreshToken();

      if (token || refresh) {
        syncSessionCookies();
      }

      if (token && !isTokenExpired(token)) {
        // Refresh stored user profile (e.g., isAdmin flag) in the background
        fetchCurrentUser()
          .then((u) => {
            if (u && !cancelled) updateStoredUser(u);
          })
          .catch(() => {});
        if (!cancelled) setReady(true);
        return;
      }

      if (refresh) {
        const session = await bootstrapSession();
        if (session) {
          const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
          if (isAuthPage) {
            router.replace('/');
          }
          if (!cancelled) setReady(true);
          return;
        }
        clearSession();
      }

      const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
      if (!isAuthPage && !getToken() && !getRefreshToken()) {
        router.replace('/login');
      } else if (isAuthPage && (getToken() || getRefreshToken())) {
        router.replace('/');
      }

      if (!cancelled) setReady(true);
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) return null;

  return <>{children}</>;
}