'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { X, Check } from 'lucide-react';
import { fetchCurrentUser } from '@/lib/api';

const DISMISS_KEY = 'offme-checklist-dismissed';

export function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(true);

  const { data: user } = useSWR('current-user-checklist', fetchCurrentUser, {
    revalidateOnFocus: true,
    dedupingInterval: 15_000,
  });

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed || !user) return null;

  const followingDone = (user.followingCount ?? 0) >= 3;
  const postDone = (user.postCount ?? 0) >= 1;
  const allDone = followingDone && postDone;

  if (allDone) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  const items = [
    {
      done: followingDone,
      label: 'Seguir 3 pessoas',
      href: '/explore',
      cta: 'Explorar',
    },
    {
      done: postDone,
      label: 'Publicar seu primeiro post',
      href: '/',
      cta: 'Ir ao feed',
    },
    {
      done: false,
      optional: true,
      label: 'Enviar feedback do beta',
      href: '/settings/feedback',
      cta: 'Feedback',
    },
  ];

  const completed = items.filter((i) => i.done && !i.optional).length;
  const total = items.filter((i) => !i.optional).length;

  return (
    <div className="border-b border-offme-border bg-offme-surface/60 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-offme-text">Primeiros passos</p>
          <p className="mt-0.5 text-[13px] text-offme-muted">
            {completed}/{total} concluídos — complete para aproveitar o beta
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 text-offme-muted hover:bg-offme-hover hover:text-offme-text"
          aria-label="Ocultar checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 text-[14px]">
            <span className="flex items-center gap-2 text-offme-text">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  item.done
                    ? 'border-offme-accent bg-offme-accent text-white'
                    : 'border-offme-border text-transparent'
                }`}
              >
                <Check className="h-3 w-3" />
              </span>
              {item.label}
              {item.optional && (
                <span className="text-[11px] font-medium text-offme-muted">(opcional)</span>
              )}
            </span>
            {!item.done && (
              <Link
                href={item.href}
                className="shrink-0 text-[13px] font-bold text-offme-accent hover:underline"
              >
                {item.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}