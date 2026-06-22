import { query } from './db';

export interface TrendingTopic {
  tag: string;
  postCount: number;
}

export async function getTrendingTopics(limit = 10): Promise<TrendingTopic[]> {
  const rows = await query<{ tag: string; post_count: string }>(
    `SELECT LOWER(tag) AS tag, COUNT(*)::text AS post_count
     FROM (
       SELECT (regexp_matches(p.text, '#([[:alnum:]_]{2,50})', 'g'))[1] AS tag
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE u.deactivated_at IS NULL
         AND COALESCE(p.status, 'published') = 'published'
         AND p.created_at > NOW() - INTERVAL '24 hours'
     ) tags
     WHERE tag IS NOT NULL
     GROUP BY LOWER(tag)
     ORDER BY COUNT(*) DESC, tag ASC
     LIMIT $1`,
    [limit]
  );

  return rows.map((row) => ({
    tag: row.tag,
    postCount: Number(row.post_count),
  }));
}