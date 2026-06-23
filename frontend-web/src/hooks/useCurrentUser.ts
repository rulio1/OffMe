'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { getStoredUser } from '@/lib/auth';

/**
 * Reactive hook that returns the current stored user and re-renders
 * whenever the user data changes (e.g. after `updateStoredUser` or
 * a storage event from another tab).
 */
export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());

    const onChange = () => setUser(getStoredUser());
    window.addEventListener('offme:user-change', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('offme:user-change', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return user;
}