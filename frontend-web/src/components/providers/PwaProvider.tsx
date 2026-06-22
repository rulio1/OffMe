'use client';

import { useEffect } from 'react';
import { InstallPwaBanner } from '@/components/layout/InstallPwaBanner';
import { registerServiceWorker } from '@/lib/pwa';

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void registerServiceWorker();
  }, []);

  return (
    <>
      {children}
      <InstallPwaBanner />
    </>
  );
}