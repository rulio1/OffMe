import { query } from './db';
import { getMediaUrlsByPostIds } from './media-repository';
import {
  type DbPost,
  type DbTimelineRow,
  toApiPost,
  toTimelineEntry,
} from './post-repository';

type EnrichExtra = {
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  repostedByMe: boolean;
  mediaUrls?: string[];
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
}> {
  if (postIds.length === 0) {
    return {
      likedIds: new Set(),
      bookmarkedIds: new Set(),
      repostedIds: new Set(),
      mediaMap: new Map(),
    };
  }

  const [flags, mediaMap] = await Promise.all([
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
  ]);

  const row = flags[0];
  return {
    likedIds: toIdSet(row?.liked_ids),
    bookmarkedIds: toIdSet(row?.bookmarked_ids),
    repostedIds: toIdSet(row?.reposted_ids),
    mediaMap,
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
    timelineSource,
  };
}

export async function enrichTimelineEntries(
  rows: (DbPost | DbTimelineRow)[],
  viewerId: number,
  source: 'following' | 'recommended'
) {
  const postIds = rows.map((r) => r.id);
  const maps = await loadEnrichment(viewerId, postIds);

  return rows.map((row) => {
    const timelineSource =
      'timeline_source' in row ? row.timeline_source : source;
    return toTimelineEntry(row, source, buildExtra(row.id, maps, timelineSource));
  });
}

export async function enrichPost(row: DbPost, viewerId: number) {
  const maps = await loadEnrichment(viewerId, [row.id]);
  return toApiPost(row, buildExtra(row.id, maps));
}

export async function enrichPosts(rows: DbPost[], viewerId: number) {
  const postIds = rows.map((r) => r.id);
  const maps = await loadEnrichment(viewerId, postIds);
  return rows.map((row) => toApiPost(row, buildExtra(row.id, maps)));
}