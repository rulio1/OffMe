'use client';

import { useEffect, useState } from 'react';
import { OffMeLogo } from '@/components/auth/OffMeLogo';

export function AppSplash() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 1100);
    const hideTimer = setTimeout(() => setVisible(false), 1420);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-offme-bg transition-opacity duration-300 ${
        exiting ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative flex items-center justify-center">
        <span
          className={`pointer-events-none absolute h-[min(180px,24vw)] w-[min(180px,24vw)] rounded-full border-2 border-offme-accent/25 ${
            exiting ? 'opacity-0' : 'logo-splash-ring'
          }`}
        />
        <div
          className={
            exiting
              ? 'scale-95 opacity-0 transition-all duration-300 ease-in'
              : 'logo-splash-enter logo-splash-breathe'
          }
        >
          <OffMeLogo size="xl" />
        </div>
      </div>
    </div>
  );
}