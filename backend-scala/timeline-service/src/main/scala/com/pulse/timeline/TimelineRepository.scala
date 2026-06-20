package com.pulse.timeline

import com.datastax.oss.driver.api.core.cql.Row
import com.pulse.shared.cassandra.CassandraClient
import com.pulse.shared.TimelineEntry
import com.twitter.util.Future
import java.time.Instant

trait TimelineRepository:
  def fanoutToFollowers(followerIds: Seq[Long], entry: TimelineEntry, createdAt: Instant): Future[Unit]
  def getHomeTimeline(userId: Long, limit: Int, before: Option[Instant]): Future[Seq[TimelineEntry]]
  def getUserTimeline(userId: Long, limit: Int, before: Option[Instant]): Future[Seq[TimelineEntry]]
  def recordFanoutState(postId: Long, authorId: Long, fanoutType: String, followerCount: Int): Future[Unit]

final class CassandraTimelineRepository(cassandra: CassandraClient) extends TimelineRepository:
  private val fanoutCql =
    """INSERT INTO home_timeline (user_id, created_at, post_id, author_id, source)
       | VALUES (?, ?, ?, ?, ?)""".stripMargin

  private val homeTimelineCql =
    """SELECT post_id, author_id, created_at, source FROM home_timeline
       | WHERE user_id = ? AND created_at < ?
       | ORDER BY created_at DESC LIMIT ?""".stripMargin

  private val homeTimelineFirstPageCql =
    """SELECT post_id, author_id, created_at, source FROM home_timeline
       | WHERE user_id = ?
       | ORDER BY created_at DESC LIMIT ?""".stripMargin

  private val userTimelineCql =
    """SELECT post_id, author_id, created_at, source FROM user_timeline
       | WHERE user_id = ?
       | ORDER BY created_at DESC LIMIT ?""".stripMargin

  private val fanoutStateCql =
    """INSERT INTO fanout_state (post_id, author_id, follower_count, fanout_type, status, started_at)
       | VALUES (?, ?, ?, ?, 'in_progress', ?)""".stripMargin

  def fanoutToFollowers(followerIds: Seq[Long], entry: TimelineEntry, createdAt: Instant): Future[Unit] =
    Future.collect:
      followerIds.map: followerId =>
        cassandra.execute(
          fanoutCql,
          Long.box(followerId),
          createdAt,
          Long.box(entry.postId),
          Long.box(entry.authorId),
          entry.source
        )
    .unit

  def getHomeTimeline(userId: Long, limit: Int, before: Option[Instant]): Future[Seq[TimelineEntry]] =
    val query = before match
      case Some(ts) => cassandra.query(homeTimelineCql, Long.box(userId), ts, Int.box(limit))
      case None     => cassandra.query(homeTimelineFirstPageCql, Long.box(userId), Int.box(limit))
    query.map(_.map(rowToEntry))

  def getUserTimeline(userId: Long, limit: Int, before: Option[Instant]): Future[Seq[TimelineEntry]] =
    cassandra.query(userTimelineCql, Long.box(userId), Int.box(limit)).map(_.map(rowToEntry))

  def recordFanoutState(postId: Long, authorId: Long, fanoutType: String, followerCount: Int): Future[Unit] =
    cassandra.execute(
      fanoutStateCql,
      Long.box(postId),
      Long.box(authorId),
      Int.box(followerCount),
      fanoutType,
      Instant.now()
    )

  private def rowToEntry(row: Row): TimelineEntry =
    TimelineEntry(
      postId = row.getLong("post_id"),
      authorId = row.getLong("author_id"),
      createdAt = row.getInstant("created_at").toEpochMilli,
      source = row.getString("source")
    )