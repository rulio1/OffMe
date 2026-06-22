import type { Poll, Post } from '@/types';
import { query } from './db';
import { getMediaUrlsByPostIds } from './media-repository';
import { getPollByPostId, toApiPoll } from './poll-repository';
import {
  type DbPost,
  type DbTimelineRow,
  findPostById,
  toApiPost,
  toTimelineEntry,
} from './post-repository';

type EnrichExtra = {
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  repostedByMe: boolean;
  mediaUrls?: string[];
  quotedPost?: Post;
  poll?: Poll;
  timelineSource?: 'following' | 'repost' | 'recommended';
};

function toIdSet(values: number[] | null | undefined): Set<number> {
  return new Set(values ?? []);
}

async function loadEnrichment(
  viewerId: number,
  postIds: number[]
): Promise<{
  likedIds: Set<number>;
  bookmarkedIds: Set<number>;
  repostedIds: Set<number>;
  mediaMap: Map<number, string[]>;
  quotedMap: Map<number, Post>;
  pollMap: Map<number, Poll>;
}> {
  if (postIds.length === 0) {
    return {
      likedIds: new Set(),
      bookmarkedIds: new Set(),
      repostedIds: new Set(),
      mediaMap: new Map(),
      quotedMap: new Map(),
      pollMap: new Map(),
    };
  }

  const [flags, mediaMap, quoteRows] = await Promise.all([
    query<{
      liked_ids: number[] | null;
      bookmarked_ids: number[] | null;
      reposted_ids: number[] | null;
    }>(
      `SELECT
         (SELECT COALESCE(array_agg(post_id), '{}') FROM post_likes
          WHERE user_id = $1 AND post_id = ANY($2::bigint[])) AS liked_ids,
         (SELECT COALESCE(array_agg(post_id), '{}') FROM post_bookmarks
          WHERE user_id = $1 AND post_id = ANY($2::bigint[])) AS bookmarked_ids,
         (SELECT COALESCE(array_agg(post_id), '{}') FROM post_reposts
          WHERE user_id = $1 AND post_id = ANY($2::bigint[])) AS reposted_ids`,
      [viewerId, postIds]
    ),
    getMediaUrlsByPostIds(postIds),
    query<{ id: number; quote_of_id: number | null }>(
      `SELECT id, quote_of_id FROM posts WHERE id = ANY($1::bigint[]) AND quote_of_id IS NOT NULL`,
      [postIds]
    ),
  ]);

  const quoteIds = quoteRows.map((r) => r.quote_of_id).filter((id): id is number => id != null);
  const quotedMap = new Map<number, Post>();

  if (quoteIds.length > 0) {
    const quotedPosts = await Promise.all(quoteIds.map((id) => findPostById(id, viewerId)));
    const quotedMediaMap = await getMediaUrlsByPostIds(quoteIds);
    for (const row of quoteRows) {
      if (row.quote_of_id == null) continue;
      const quoted = quotedPosts.find((p) => p?.id === row.quote_of_id);
      if (quoted) {
        quotedMap.set(
          row.id,
          toApiPost(quoted, { mediaUrls: quotedMediaMap.get(quoted.id) })
        );
      }
    }
  }

  const pollMap = new Map<number, Poll>();
  await Promise.all(
    postIds.map(async (postId) => {
      const poll = await getPollByPostId(postId, viewerId);
      if (poll) pollMap.set(postId, toApiPoll(poll));
    })
  );

  const row = flags[0];
  return {
    likedIds: toIdSet(row?.liked_ids),
    bookmarkedIds: toIdSet(row?.bookmarked_ids),
    repostedIds: toIdSet(row?.reposted_ids),
    mediaMap,
    quotedMap,
    pollMap,
  };
}

function buildExtra(
  rowId: number,
  maps: Awaited<ReturnType<typeof loadEnrichment>>,
  timelineSource?: 'following' | 'repost' | 'recommended'
): EnrichExtra {
  return {
    likedByMe: maps.likedIds.has(rowId),
    bookmarkedByMe: maps.bookmarkedIds.has(rowId),
    repostedByMe: maps.repostedIds.has(rowId),
    mediaUrls: maps.mediaMap.get(rowId),
    quotedPost: maps.quotedMap.get(rowId),
    poll: maps.pollMap.get(rowId),
    timelineSource,
  };
}

export async function enrichTimelineEntries(
  rows: (DbPost | DbTimelineRow)[],
  viewerId: number | undefined,
  source: 'following' | 'recommended'
) {
  if (viewerId == null) {
    return rows.map((row) => {
      const timelineSource =
        'timeline_source' in row ? row.timeline_source : source;
      return toTimelineEntry(row, source, { timelineSource });
    });
  }

  const postIds = rows.map((r) => r.id);
  const maps = await loadEnrichment(viewerId, postIds);

  return rows.map((row) => {
    const timelineSource =
      'timeline_source' in row ? row.timeline_source : source;
    return toTimelineEntry(row, source, buildExtra(row.id, maps, timelineSource));
  });
}

export async function enrichPost(row: DbPost, viewerId?: number) {
  if (viewerId == null) {
    return toApiPost(row);
  }
  const maps = await loadEnrichment(viewerId, [row.id]);
  return toApiPost(row, buildExtra(row.id, maps));
}

export async function enrichPosts(rows: DbPost[], viewerId: number) {
  const postIds = rows.map((r) => r.id);
  const maps = await loadEnrichment(viewerId, postIds);
  return rows.map((row) => toApiPost(row, buildExtra(row.id, maps)));
}