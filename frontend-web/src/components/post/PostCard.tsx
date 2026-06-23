'use client';

import { memo, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ban, VolumeX, Flag, Quote } from 'lucide-react';
import { ActionIcon } from '@/components/icons/ActionIcons';
import { PostRichText } from '@/components/post/PostRichText';
import { VerifiedBadge } from '@/components/user/VerifiedBadge';
import { OfficialBadge } from '@/components/user/OfficialBadge';
import { useCompose } from '@/components/providers/ComposeProvider';
import type { Poll, Post, User } from '@/types';
import clsx from 'clsx';
import {
  blockUser,
  bookmarkPost,
  deletePost,
  likePost,
  muteUser,
  reportPost,
  repostPost,
  setProfilePinnedPost,
  unbookmarkPost,
  unlikePost,
  unrepostPost,
  votePoll,
} from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { formatPostTime } from '@/lib/format-time';
import { UserAvatar } from '@/components/user/UserAvatar';

interface PostCardProps {
  post: Post;
  onDeleted?: (postId: number) => void;
  pinnedPostId?: number;
  onPinChange?: (postId: number | null) => void;
  isPinnedHighlight?: boolean;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toString();
}

function QuotedPostPreview({ quoted }: { quoted: Post }) {
  const author: User = quoted.author ?? {
    id: quoted.authorId,
    username: 'user',
    displayName: 'OffMe User',
    verified: false,
    isOfficial: false,
  };

  return (
    <div className="mt-3 rounded-xl border border-offme-border p-3 text-sm">
      <p className="font-bold">
        {author.displayName}
        {author.isOfficial ? (
          <OfficialBadge className="ml-1 inline-block" />
        ) : author.verified ? (
          <VerifiedBadge className="ml-1 inline-block" />
        ) : null}
        <span className="ml-1 font-normal text-offme-muted">@{author.username}</span>
      </p>
      {quoted.text.trim().length > 0 && (
        <p className="mt-1 line-clamp-3 text-offme-muted">
          <PostRichText text={quoted.text} />
        </p>
      )}
    </div>
  );
}

function PollBlock({
  postId,
  poll: initialPoll,
}: {
  postId: number;
  poll: Poll;
}) {
  const [poll, setPoll] = useState(initialPoll);
  const [voting, setVoting] = useState(false);

  const handleVote = async (optionId: number) => {
    if (poll.ended || voting) return;
    setVoting(true);
    try {
      const updated = await votePoll(postId, optionId);
      setPoll(updated);
    } catch {
      // keep current state
    } finally {
      setVoting(false);
    }
  };

  const showResults = poll.ended || poll.votedOptionId != null || poll.totalVotes > 0;

  return (
    <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
      {poll.options.map((option) => {
        const pct =
          poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
        const selected = poll.votedOptionId === option.id;

        return (
          <button
            key={option.id}
            type="button"
            disabled={poll.ended || voting}
            onClick={() => handleVote(option.id)}
            className={clsx(
              'relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors',
              selected
                ? 'border-offme-accent text-offme-accent'
                : 'border-offme-border hover:border-offme-accent/50'
            )}
          >
            {showResults && (
              <span
                className="absolute inset-y-0 left-0 bg-offme-accent/10"
                style={{ width: `${pct}%` }}
              />
            )}
            <span className="relative flex items-center justify-between gap-2">
              <span>{option.label}</span>
              {showResults && <span className="text-xs text-offme-muted">{pct}%</span>}
            </span>
          </button>
        );
      })}
      <p className="text-xs text-offme-muted">
        {poll.totalVotes} voto{poll.totalVotes !== 1 ? 's' : ''}
        {poll.ended ? ' · Encerrada' : ''}
      </p>
    </div>
  );
}

function PostCardInner({
  post,
  onDeleted,
  pinnedPostId,
  onPinChange,
  isPinnedHighlight,
}: PostCardProps) {
  const router = useRouter();
  const { openCompose } = useCompose();
  const currentUser = getStoredUser();
  const menuRef = useRef<HTMLDivElement>(null);

  const author: User = post.author ?? {
    id: post.authorId,
    username: 'user',
    displayName: 'OffMe User',
    verified: false,
    isOfficial: false,
  };

  const isOwnPost = currentUser?.id === post.authorId;

  const [liked, setLiked] = useState(Boolean(post.likedByMe));
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [liking, setLiking] = useState(false);

  const [reposted, setReposted] = useState(Boolean(post.repostedByMe));
  const [repostCount, setRepostCount] = useState(post.repostCount);
  const [reposting, setReposting] = useState(false);

  const [bookmarked, setBookmarked] = useState(Boolean(post.bookmarkedByMe));
  const [bookmarking, setBookmarking] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuBusy, setMenuBusy] = useState(false);
  const [reportMode, setReportMode] = useState(false);
  const [shareLabel, setShareLabel] = useState('');

  const REPORT_REASONS = [
    { value: 'spam' as const, label: 'Spam' },
    { value: 'abuse' as const, label: 'Abuso ou assédio' },
    { value: 'other' as const, label: 'Outro' },
  ];

  const timeLabel = formatPostTime(post.createdAt);
  const viewCount = Math.max(post.likeCount * 3 + post.replyCount * 2, post.likeCount);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

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

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/post/${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'OffMe', url });
        return;
      }
    } catch {
      // fall through to copy
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareLabel('Link copiado');
      setTimeout(() => setShareLabel(''), 2000);
    } catch {
      setShareLabel('Erro ao copiar');
      setTimeout(() => setShareLabel(''), 2000);
    }
  };

  const handleQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openCompose({ quoteOfId: post.id, quotedPost: post });
  };

  const handleDelete = async () => {
    if (menuBusy) return;
    setMenuBusy(true);
    try {
      await deletePost(post.id);
      setDismissed(true);
      onDeleted?.(post.id);
    } catch {
      // keep post visible on error
    } finally {
      setMenuBusy(false);
      setMenuOpen(false);
    }
  };

  const handleBlock = async () => {
    if (menuBusy) return;
    setMenuBusy(true);
    try {
      await blockUser(author.username);
      setDismissed(true);
    } catch {
      // ignore
    } finally {
      setMenuBusy(false);
      setMenuOpen(false);
    }
  };

  const handleMute = async () => {
    if (menuBusy) return;
    setMenuBusy(true);
    try {
      await muteUser(author.username);
      setDismissed(true);
    } catch {
      // ignore
    } finally {
      setMenuBusy(false);
      setMenuOpen(false);
    }
  };

  const handleReport = async (reason: 'spam' | 'abuse' | 'other') => {
    if (menuBusy) return;
    setMenuBusy(true);
    try {
      await reportPost(post.id, reason);
      setMenuOpen(false);
      setReportMode(false);
    } catch {
      // ignore
    } finally {
      setMenuBusy(false);
    }
  };

  const openThread = () => router.push(`/post/${post.id}`);

  if (dismissed) return null;

  return (
    <article className="offme-card px-4 py-3" onClick={openThread} role="link" tabIndex={0}>
      {post.timelineSource === 'repost' && (
        <p className="mb-2 flex items-center gap-1.5 pl-12 text-[13px] text-offme-muted">
          <ActionIcon name="repost" filled className="h-3.5 w-3.5" />
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
              {author.isOfficial ? (
                <OfficialBadge />
              ) : author.verified ? (
                <VerifiedBadge />
              ) : null}
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

            <div ref={menuRef} className="absolute right-0 top-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => {
                    if (v) setReportMode(false);
                    return !v;
                  });
                }}
                className="rounded-full p-1 text-offme-muted transition-colors hover:bg-offme-hover hover:text-offme-text"
                aria-label="Mais opções"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <ActionIcon name="more" className="h-[17px] w-[17px]" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-offme-border bg-offme-bg py-1 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isOwnPost && (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={async () => {
                          setMenuBusy(true);
                          try {
                            const nextId = pinnedPostId === post.id ? null : post.id;
                            await setProfilePinnedPost(nextId);
                            onPinChange?.(nextId);
                            setMenuOpen(false);
                          } catch {
                            // ignore
                          } finally {
                            setMenuBusy(false);
                          }
                        }}
                        disabled={menuBusy}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-offme-hover disabled:opacity-50"
                      >
                        <ActionIcon name="pin" className="h-4 w-4" />
                        {pinnedPostId === post.id ? 'Desfixar do perfil' : 'Fixar no perfil'}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleDelete}
                        disabled={menuBusy}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <ActionIcon name="delete" className="h-4 w-4" />
                        Excluir post
                      </button>
                    </>
                  )}
                  {!isOwnPost && (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleMute}
                        disabled={menuBusy}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-offme-hover disabled:opacity-50"
                      >
                        <VolumeX className="h-4 w-4" />
                        Silenciar @{author.username}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleBlock}
                        disabled={menuBusy}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-offme-hover disabled:opacity-50"
                      >
                        <Ban className="h-4 w-4" />
                        Bloquear @{author.username}
                      </button>
                    </>
                  )}
                  {!reportMode ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setReportMode(true)}
                      disabled={menuBusy}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-offme-hover disabled:opacity-50"
                    >
                      <Flag className="h-4 w-4" />
                      Denunciar post
                    </button>
                  ) : (
                    <>
                      <p className="px-4 py-2 text-xs font-semibold text-offme-muted">
                        Motivo da denúncia
                      </p>
                      {REPORT_REASONS.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          role="menuitem"
                          onClick={() => handleReport(item.value)}
                          disabled={menuBusy}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-offme-hover disabled:opacity-50"
                        >
                          {item.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => setReportMode(false)}
                        className="flex w-full px-4 py-2 text-left text-xs text-offme-muted hover:bg-offme-hover"
                      >
                        Voltar
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {isPinnedHighlight && (
            <p className="mb-1 inline-flex items-center gap-1 text-xs font-bold text-offme-muted">
              <ActionIcon name="pin" className="h-3.5 w-3.5" />
              Post fixado
            </p>
          )}
          {post.text.trim().length > 0 && (
            <p className="mt-1 text-[15px] leading-5">
              <PostRichText text={post.text} />
            </p>
          )}

          {post.quotedPost && <QuotedPostPreview quoted={post.quotedPost} />}

          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div
              className={clsx(
                'mt-3 overflow-hidden rounded-2xl border border-offme-border',
                post.mediaUrls.length > 1 ? 'grid grid-cols-2 gap-0.5' : ''
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {post.mediaUrls.map((url) => (
                <div key={url} className="relative aspect-video max-h-[min(512px,70vh)] w-full">
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {post.poll && <PollBlock postId={post.id} poll={post.poll} />}

          <div
            className="post-engagement mt-3 flex max-w-[425px] justify-between text-offme-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href={`/post/${post.id}`}
              className={clsx('post-action post-action-reply', post.replyCount > 0 && 'gap-1')}
            >
              <ActionIcon name="reply" className="h-[18px] w-[18px]" />
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
              <ActionIcon name="repost" filled={reposted} className="h-[18px] w-[18px]" />
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
              <ActionIcon name="like" filled={liked} className="h-[18px] w-[18px]" />
              {likeCount > 0 && <span className="text-[13px]">{formatCount(likeCount)}</span>}
            </button>

            <button type="button" className="post-action post-action-views gap-1">
              <ActionIcon name="views" className="h-[18px] w-[18px]" />
              {viewCount > 0 && <span className="text-[13px]">{formatCount(viewCount)}</span>}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="post-action post-action-share"
              aria-label={shareLabel || 'Compartilhar'}
              title={shareLabel || undefined}
            >
              <ActionIcon name="share" className="h-[18px] w-[18px]" />
            </button>

            <button
              type="button"
              onClick={handleQuote}
              className="post-action post-action-share hidden sm:inline-flex"
              aria-label="Citar"
            >
              <Quote className="h-[18px] w-[18px] stroke-[1.75]" />
            </button>

            <button
              type="button"
              onClick={handleBookmark}
              disabled={bookmarking}
              className={clsx(
                'post-action post-action-bookmark',
                bookmarked && 'text-offme-accent'
              )}
            >
              <ActionIcon name="bookmark" filled={bookmarked} className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export const PostCard = memo(PostCardInner, (prev, next) => prev.post.id === next.post.id);