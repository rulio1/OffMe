'use client';

import Link from 'next/link';
import { ChevronDown, UserRoundPlus } from 'lucide-react';
import clsx from 'clsx';
import { OffMeLogo } from '@/components/auth/OffMeLogo';
import { UserAvatar } from '@/components/user/UserAvatar';
import { getStoredUser } from '@/lib/auth';
import type { FeedTab } from '@/types';

interface FeedHeaderProps {
  tab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

const TABS: { id: FeedTab; label: string }[] = [
  { id: 'for-you', label: 'For you' },
  { id: 'following', label: 'Following' },
];

export function FeedHeader({ tab, onTabChange }: FeedHeaderProps) {
  const user = getStoredUser();

  return (
    <header className="sticky top-0 z-20 border-b border-offme-border bg-offme-bg/90 backdrop-blur-xl">
      <div className="flex h-[53px] items-center justify-between px-4 md:hidden">
        <Link
          href="/profile"
          className="flex h-8 w-8 shrink-0 items-center justify-center"
          aria-label="Perfil"
        >
          <UserAvatar url={user?.avatarUrl} size="sm" />
        </Link>

        <Link href="/" className="flex items-center justify-center" aria-label="OffMe">
          <OffMeLogo size="sm" className="h-8 w-8" />
        </Link>

        <Link
          href="/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full text-offme-text transition-colors hover:bg-black/5"
          aria-label="Conta"
        >
          <UserRoundPlus className="h-[22px] w-[22px] stroke-[1.75]" />
        </Link>
      </div>

      <div className="flex h-[53px]">
        {TABS.map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={clsx(
                'feed-tab group relative flex flex-1 flex-col items-center justify-center gap-0.5',
                active ? 'feed-tab-active' : 'feed-tab-inactive'
              )}
            >
              <span className="flex items-center gap-0.5">
                {label}
                {active && <ChevronDown className="h-4 w-4 stroke-[2.5]" />}
              </span>
              {active && <span className="feed-tab-indicator" />}
            </button>
          );
        })}

        <button
          type="button"
          className="feed-tab feed-tab-inactive relative flex flex-1 items-center justify-center gap-1.5"
          aria-label="Adicionar feed"
        >
          Add +
          <span className="h-1.5 w-1.5 rounded-full bg-offme-accent" aria-hidden />
        </button>
      </div>
    </header>
  );
}