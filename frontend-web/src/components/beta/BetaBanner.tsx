'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const STORAGE_KEY = 'offme-beta-banner-dismissed';

export function BetaBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== '1');
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="border-b border-offme-accent/20 bg-offme-accent/10 px-4 py-2.5">
      <div className="mx-auto flex max-w-[600px] items-start gap-3">
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-offme-text">
          <span className="mr-1.5 rounded-full bg-offme-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
            Beta
          </span>
          O OffMe está em beta aberto. Encontrou um bug ou tem uma ideia?{' '}
          <Link href="/settings/feedback" className="font-bold text-offme-accent hover:underline">
            Envie feedback
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 text-offme-muted transition-colors hover:bg-offme-hover hover:text-offme-text"
          aria-label="Fechar aviso de beta"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}