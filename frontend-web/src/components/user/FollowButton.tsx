'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { followUser, unfollowUser } from '@/lib/api';
import type { User } from '@/types';

interface FollowButtonProps {
  user: User;
  onUpdate?: (user: User) => void;
  size?: 'sm' | 'md';
}

export function FollowButton({ user, onUpdate, size = 'md' }: FollowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(Boolean(user.isFollowing));

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const updated = isFollowing
        ? await unfollowUser(user.username)
        : await followUser(user.username);
      setIsFollowing(Boolean(updated.isFollowing));
      onUpdate?.(updated);
    } catch {
      // keep current state on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={clsx(
        'shrink-0 rounded-full font-bold transition-colors disabled:opacity-50',
        size === 'sm' ? 'px-4 py-1.5 text-sm' : 'px-5 py-2',
        isFollowing
          ? 'border border-offme-border bg-transparent text-offme-text hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400'
          : 'bg-offme-text text-offme-bg hover:bg-offme-muted'
      )}
    >
      {loading ? '...' : isFollowing ? 'Seguindo' : 'Seguir'}
    </button>
  );
}