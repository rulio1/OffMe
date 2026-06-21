import { getBookmarkedPostIds } from './bookmark-repository';
import { getMediaUrlsByPostIds } from './media-repository';
import { getLikedPostIds } from './like-repository';
import { getRepostedPostIds } from './repost-repository';
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

async function loadEnrichment(
  viewerId: number,
  postIds: number[]
): Promise<{
  likedIds: Set<number>;
  bookmarkedIds: Set<number>;
  repostedIds: Set<number>;
  mediaMap: Map<number, string[]>;
}> {
  const [likedIds, bookmarkedIds, repostedIds, mediaMap] = await Promise.all([
    getLikedPostIds(viewerId, postIds),
    getBookmarkedPostIds(viewerId, postIds),
    getRepostedPostIds(viewerId, postIds),
    getMediaUrlsByPostIds(postIds),
  ]);
  return { likedIds, bookmarkedIds, repostedIds, mediaMap };
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