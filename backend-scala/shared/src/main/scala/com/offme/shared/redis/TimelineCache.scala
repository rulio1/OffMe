package com.offme.shared.redis

import com.twitter.finagle.redis.Client
import com.twitter.finagle.Redis
import com.twitter.io.Buf
import com.twitter.util.Future
import com.offme.shared.TimelineEntry

/** Redis-backed timeline segment cache (Pelikan-compatible key schema).
  *
  * Key pattern: tl:{userId}:{segment} → sorted set of post_id:score
  * TTL: 300s for hot users, 60s for cold; invalidated on write fanout.
  */
trait TimelineCache:
  def getSegment(userId: Long, segment: Int): Future[Seq[TimelineEntry]]
  def setSegment(userId: Long, segment: Int, entries: Seq[TimelineEntry]): Future[Unit]
  def invalidate(userId: Long): Future[Unit]

final class RedisTimelineCache(host: String, port: Int) extends TimelineCache:
  private val client: Client = Redis.newRichClient(s"$host:$port")

  private def key(userId: Long, segment: Int): String = s"tl:$userId:$segment"

  def getSegment(userId: Long, segment: Int): Future[Seq[TimelineEntry]] =
    client.zrevrange(Buf.Utf8(key(userId, segment)), 0, -1).map: bufs =>
      bufs.map(decodeEntry)

  def setSegment(userId: Long, segment: Int, entries: Seq[TimelineEntry]): Future[Unit] =
    val k = Buf.Utf8(key(userId, segment))
    for
      _ <- client.del(Seq(k))
      _ <- if entries.nonEmpty then
        val members = entries.map(e => (encodeEntry(e), e.createdAt.toDouble))
        client.zadd(k, members*)
      else Future.Unit
      _ <- client.expire(k, 300)
    yield ()

  def invalidate(userId: Long): Future[Unit] =
    // Delete segments 0-9 (covers ~200 entries at page size 20)
    Future.collect((0 until 10).map(seg => client.del(Seq(Buf.Utf8(key(userId, seg)))))).unit

  private def encodeEntry(e: TimelineEntry): Buf.Utf8 =
    Buf.Utf8(s"${e.postId}:${e.authorId}:${e.source}")

  private def decodeEntry(buf: Buf): TimelineEntry =
    val parts = Buf.Utf8.unwrap(buf).split(":")
    TimelineEntry(
      postId = parts(0).toLong,
      authorId = parts(1).toLong,
      createdAt = 0L,
      source = parts(2)
    )

final case class TimelineEntry(
    postId: Long,
    authorId: Long,
    createdAt: Long,
    source: String,
    score: Option[Double] = None
)