'use client';

import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Repeat2, Heart, Share, Bookmark, MoreHorizontal } from 'lucide-react';
import type { Post } from '@/types';
import clsx from 'clsx';

interface PostCardProps {
  post: Post;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function PostCard({ post }: PostCardProps) {
  const author = post.author ?? {
    id: post.authorId,
    username: 'user',
    displayName: 'Pulse User',
    verified: false,
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <article className="pulse-card cursor-pointer">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-pulse-surface" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[15px]">
            <span className="truncate font-bold hover:underline">{author.displayName}</span>
            {author.verified && (
              <span className="text-pulse-accent" aria-label="Verified">
                ✓
              </span>
            )}
            <span className="truncate text-pulse-muted">@{author.username}</span>
            <span className="text-pulse-muted">·</span>
            <time className="shrink-0 text-pulse-muted hover:underline">{timeAgo}</time>
            <button className="ml-auto rounded-full p-1 text-pulse-muted hover:bg-pulse-accent/10 hover:text-pulse-accent">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-normal">
            {post.text}
          </p>

          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-pulse-border">
              <div className="aspect-video bg-pulse-surface" />
            </div>
          )}

          <div className="mt-3 flex max-w-[425px] justify-between text-pulse-muted">
            <ActionButton icon={MessageCircle} count={post.replyCount} hoverColor="hover:text-pulse-accent" />
            <ActionButton icon={Repeat2} count={post.repostCount} hoverColor="hover:text-pulse-repost" />
            <ActionButton icon={Heart} count={post.likeCount} hoverColor="hover:text-pulse-like" />
            <button className="pulse-btn-ghost group">
              <Bookmark className="h-[18px] w-[18px]" />
            </button>
            <button className="pulse-btn-ghost group">
              <Share className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ActionButton({
  icon: Icon,
  count,
  hoverColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  hoverColor: string;
}) {
  return (
    <button className={clsx('pulse-btn-ghost group flex items-center gap-1', hoverColor)}>
      <Icon className="h-[18px] w-[18px]" />
      {count > 0 && <span className="text-xs">{formatCount(count)}</span>}
    </button>
  );
}