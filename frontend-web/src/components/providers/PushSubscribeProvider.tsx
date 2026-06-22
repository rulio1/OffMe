'use client';

import { useEffect } from 'react';
import { isAuthenticated } from '@/lib/auth';
import { subscribeToPush } from '@/lib/push-client';

export function PushSubscribeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!isAuthenticated()) return;
    void subscribeToPush();
  }, []);

  return <>{children}</>;
}