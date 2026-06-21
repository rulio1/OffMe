'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  Repeat2,
  Heart,
  BarChart2,
  Bookmark,
  Share,
  X,
  BadgeCheck,
} from 'lucide-react';
import type { Post } from '@/types';
import clsx from 'clsx';
import {
  bookmarkPost,
  likePost,
  repostPost,
  unbookmarkPost,
  unlikePost,
  unrepostPost,
} from '@/lib/api';
import { formatPostTime } from '@/lib/format-time';
import { UserAvatar } from '@/components/user/UserAvatar';

interface PostCardProps {
  post: Post;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toString();
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const author = post.author ?? {
    id: post.authorId,
    username: 'user',
    displayName: 'OffMe User',
    verified: false,
  };

  const [liked, setLiked] = useState(Boolean(post.likedByMe));
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [liking, setLiking] = useState(false);

  const [reposted, setReposted] = useState(Boolean(post.repostedByMe));
  const [repostCount, setRepostCount] = useState(post.repostCount);
  const [reposting, setReposting] = useState(false);

  const [bookmarked, setBookmarked] = useState(Boolean(post.bookmarkedByMe));
  const [bookmarking, setBookmarking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const timeLabel = formatPostTime(post.createdAt);
  const viewCount = Math.max(post.likeCount * 3 + post.replyCount * 2, post.likeCount);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (liking) return;
    setLiking(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(c - 1, 0) : c + 1));

    try {
      const result = wasLiked ? await unlikePost(post.id) : await likePost(post.id);
      setLiked(result.likedByMe);
      setLikeCount(result.likeCount);
    } catch {
      setLiked(wasLiked);
      setLikeCount(post.likeCount);
    } finally {
      setLiking(false);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (reposting) return;
    setReposting(true);
    const wasReposted = reposted;
    setReposted(!wasReposted);
    setRepostCount((c) => (wasReposted ? Math.max(c - 1, 0) : c + 1));

    try {
      const result = wasReposted ? await unrepostPost(post.id) : await repostPost(post.id);
      setReposted(result.repostedByMe);
      setRepostCount(result.repostCount);
    } catch {
      setReposted(wasReposted);
      setRepostCount(post.repostCount);
    } finally {
      setReposting(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarking) return;
    setBookmarking(true);
    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);

    try {
      const result = wasBookmarked
        ? await unbookmarkPost(post.id)
        : await bookmarkPost(post.id);
      setBookmarked(result.bookmarkedByMe);
    } catch {
      setBookmarked(wasBookmarked);
    } finally {
      setBookmarking(false);
    }
  };

  const openThread = () => router.push(`/post/${post.id}`);

  if (dismissed) return null;

  return (
    <article className="offme-card px-4 py-3" onClick={openThread} role="link" tabIndex={0}>
      {post.timelineSource === 'repost' && (
        <p className="mb-2 flex items-center gap-1.5 pl-12 text-[13px] text-offme-muted">
          <Repeat2 className="h-3.5 w-3.5" />
          Repost
        </p>
      )}

      <div className="flex gap-3">
        <Link
          href={`/profile/${author.username}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          <UserAvatar url={author.avatarUrl} size="md" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="relative flex items-start gap-1 pr-8 text-[15px] leading-5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-1">
              <Link
                href={`/profile/${author.username}`}
                onClick={(e) => e.stopPropagation()}
                className="truncate font-bold hover:underline"
              >
                {author.displayName}
              </Link>
              {author.verified && (
                <BadgeCheck
                  className="h-[18px] w-[18px] shrink-0 fill-offme-accent text-offme-bg"
                  aria-label="Verificado"
                />
              )}
              <Link
                href={`/profile/${author.username}`}
                onClick={(e) => e.stopPropagation()}
                className="truncate text-offme-muted hover:underline"
              >
                @{author.username}
              </Link>
              <span className="text-offme-muted">·</span>
              <time className="shrink-0 text-offme-muted hover:underline">{timeLabel}</time>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDismissed(true);
              }}
              className="absolute right-0 top-0 rounded-full p-1 text-offme-muted transition-colors hover:bg-black/5 hover:text-offme-text"
              aria-label="Ocultar post"
            >
              <X className="h-[17px] w-[17px] stroke-[2]" />
            </button>
          </div>

          {post.text.trim().length > 0 && (
            <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-5">
              {post.text}
            </p>
          )}

          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div
              className={clsx(
                'mt-3 overflow-hidden rounded-2xl border border-offme-border',
                post.mediaUrls.length > 1 ? 'grid grid-cols-2 gap-0.5' : ''
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {post.mediaUrls.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="max-h-[min(512px,70vh)] w-full object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          <div
            className="post-engagement mt-3 flex max-w-[425px] justify-between text-offme-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href={`/post/${post.id}`}
              className={clsx('post-action post-action-reply', post.replyCount > 0 && 'gap-1')}
            >
              <MessageCircle className="h-[18px] w-[18px] stroke-[1.75]" />
              {post.replyCount > 0 && <span className="text-[13px]">{formatCount(post.replyCount)}</span>}
            </Link>

            <button
              type="button"
              onClick={handleRepost}
              disabled={reposting}
              className={clsx(
                'post-action post-action-repost',
                reposted && 'text-offme-repost',
                repostCount > 0 && 'gap-1'
              )}
            >
              <Repeat2 className="h-[18px] w-[18px] stroke-[1.75]" />
              {repostCount > 0 && <span className="text-[13px]">{formatCount(repostCount)}</span>}
            </button>

            <button
              type="button"
              onClick={handleLike}
              disabled={liking}
              className={clsx(
                'post-action post-action-like',
                liked && 'text-offme-like',
                likeCount > 0 && 'gap-1'
              )}
            >
              <Heart className={clsx('h-[18px] w-[18px] stroke-[1.75]', liked && 'fill-current')} />
              {likeCount > 0 && <span className="text-[13px]">{formatCount(likeCount)}</span>}
            </button>

            <button type="button" className="post-action post-action-views gap-1">
              <BarChart2 className="h-[18px] w-[18px] stroke-[1.75]" />
              {viewCount > 0 && <span className="text-[13px]">{formatCount(viewCount)}</span>}
            </button>

            <button
              type="button"
              className="post-action post-action-share"
              aria-label="Compartilhar"
            >
              <Share className="h-[18px] w-[18px] stroke-[1.75]" />
            </button>

            <button
              type="button"
              onClick={handleBookmark}
              disabled={bookmarking}
              className={clsx(
                'post-action post-action-bookmark hidden md:inline-flex',
                bookmarked && 'text-offme-accent'
              )}
            >
              <Bookmark className={clsx('h-[18px] w-[18px] stroke-[1.75]', bookmarked && 'fill-current')} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}