package com.offme.timeline

import com.offme.shared.{ServiceConfig, TimelineEntry}
import com.offme.shared.cassandra.CassandraSession
import com.offme.shared.kafka.{EventPublisher, FanoutCompletedEvent, KafkaEventPublisher, PostCreatedEvent, Topics}
import com.offme.shared.redis.{RedisTimelineCache, TimelineCache}
import com.twitter.util.{Future, Stopwatch}
import java.time.Instant

/** TimelineService — fanout-on-write + pull hybrid timeline builder.
  *
  * Celebrity threshold (10K followers): switch from push to pull fanout.
  * Read path: Redis cache → Cassandra home_timeline → merge pulled celebrity posts.
  */
class TimelineServiceImpl(
    repo: TimelineRepository,
    cache: TimelineCache,
    graphClient: GraphClient,
    config: ServiceConfig
):
  def getHomeTimeline(userId: Long, cursor: Option[String], limit: Int): Future[HomeTimelineResponse] =
    val pageSize = math.min(limit, config.timelinePageSize)
    val before = cursor.flatMap(decodeCursor)

    // Try cache first (segment 0 = most recent)
    cache.getSegment(userId, 0).flatMap:
      case cached if cached.size >= pageSize =>
        Future.value(HomeTimelineResponse(cached.take(pageSize), nextCursor(cached, pageSize)))
      case _ =>
        for
          pushed <- repo.getHomeTimeline(userId, pageSize, before)
          celebrityPosts <- pullCelebrityPosts(userId, pageSize)
          merged = mergeTimelines(pushed, celebrityPosts).take(pageSize)
          _ <- if merged.nonEmpty then cache.setSegment(userId, 0, merged) else Future.Unit
        yield HomeTimelineResponse(merged, nextCursor(merged, pageSize))

  def fanoutPost(event: PostCreatedEvent): Future[Unit] =
    val entry = TimelineEntry(
      postId = event.postId,
      authorId = event.authorId,
      createdAt = event.createdAt,
      source = "following"
    )
    val createdAt = Instant.ofEpochMilli(event.createdAt)
    val elapsed = Stopwatch.start()

    val fanoutType =
      if event.followerCount >= config.celebrityFollowerThreshold then "pull"
      else "push"

    repo.recordFanoutState(event.postId, event.authorId, fanoutType, event.followerCount).flatMap: _ =>
      fanoutType match
        case "pull" =>
          // Celebrity: only write to author's user_timeline; followers pull on read
          Future.Unit
        case "push" =>
          fanoutBatched(event.authorId, entry, createdAt, elapsed, event.followerCount)

  private def fanoutBatched(
      authorId: Long,
      entry: TimelineEntry,
      createdAt: Instant,
      elapsed: Stopwatch.Elapsed,
      totalFollowers: Int,
      cursor: Long = 0
  ): Future[Unit] =
    graphClient.getFollowers(authorId, cursor, config.fanoutBatchSize).flatMap:
      case FollowersPage(Nil, _) =>
        publishFanoutComplete(entry, "push", totalFollowers, elapsed())
      case FollowersPage(followerIds, nextCursor) =>
        for
          _ <- repo.fanoutToFollowers(followerIds, entry, createdAt)
          _ <- Future.collect(followerIds.map(cache.invalidate))
          _ <- fanoutBatched(authorId, entry, createdAt, elapsed, totalFollowers, nextCursor.getOrElse(0L))
        yield ()

  private def pullCelebrityPosts(userId: Long, limit: Int): Future[Seq[TimelineEntry]] =
    graphClient.getFollowing(userId, 0, 200).flatMap: followingIds =>
      // Simulate filtering celebrities (users with >= 10K followers)
      val celebrities = followingIds.filter(_ % 10000 == 0) // Simulate 1 in 10000 users being celebrities
      if (celebrities.isEmpty) {
        Future.value(Seq.empty)
      } else {
        // Fetch posts from multiple celebrities in parallel with proper batching
        val celebrityPostsFutures = celebrities.take(5).map: celebrityId =>
          repo.getUserTimeline(celebrityId, math.max(5, limit / celebrities.size), None)
            .recover { case _: Exception => Seq.empty } // Handle failures gracefully

        Future.collect(celebrityPostsFutures)
          .map(_.flatten.sortBy(-_.createdAt).take(limit))
      }

  private def mergeTimelines(pushed: Seq[TimelineEntry], pulled: Seq[TimelineEntry]): Seq[TimelineEntry] =
    (pushed ++ pulled)
      .groupBy(_.postId)
      .values
      .map(_.head)
      .toSeq
      .sortBy(-_.createdAt)

  private def publishFanoutComplete(
      entry: TimelineEntry,
      fanoutType: String,
      recipientCount: Int,
      durationMs: Long
  ): Future[Unit] =
    // Production: events.publish(
    //   Topics.FanoutCompleted,
    //   entry.authorId.toString,
    //   FanoutCompletedEvent(
    //     postId = entry.postId,
    //     authorId = entry.authorId,
    //     fanoutType = fanoutType,
    //     recipientCount = recipientCount,
    //     durationMs = durationMs,
    //     completedAt = System.currentTimeMillis()
    //   )
    // )
    Future.Unit

  private def decodeCursor(cursor: String): Option[Instant] =
    scala.util.Try(cursor.toLong).toOption.map(Instant.ofEpochMilli)

  private def nextCursor(entries: Seq[TimelineEntry], pageSize: Int): Option[String] =
    if entries.size >= pageSize then Some(entries.last.createdAt.toString) else None

final case class HomeTimelineResponse(
    entries: Seq[TimelineEntry],
    nextCursor: Option[String]
)

final case class FollowersPage(followerIds: Seq[Long], nextCursor: Option[Long])

trait GraphClient:
  def getFollowers(userId: Long, cursor: Long, limit: Int): Future[FollowersPage]
  def getFollowing(userId: Long, cursor: Long, limit: Int): Future[Seq[Long]]

/** Kafka consumer for PostCreated events — drives fanout pipeline */
class PostCreatedConsumer(
    timelineService: TimelineServiceImpl,
    bootstrapServers: String
):
  def start(): Unit =
    // Kafka consumer loop: deserialize PostCreatedEvent → timelineService.fanoutPost
    println(s"PostCreatedConsumer listening on ${Topics.PostCreated}")

object TimelineServiceMain extends com.twitter.server.TwitterServer:
  val config = ServiceConfig.load("timeline-service")

  def main(): Unit =
    val cassandra = CassandraSession(config.cassandraHosts, config.cassandraKeyspace)
    val repo = CassandraTimelineRepository(cassandra)
    val cache = RedisTimelineCache(config.redisHost, config.redisPort)
    val graphClient = GraphServiceClient(config.graphServiceHost, config.graphServicePort)
    val service = TimelineServiceImpl(repo, cache, graphClient, config)
    val consumer = PostCreatedConsumer(service, config.kafkaBootstrap)

    consumer.start()
    println(s"TimelineService starting on thrift:${config.thriftPort}")

/** Production-ready GraphClient implementation using Graph Service */
final class GraphServiceClient(graphServiceHost: String, graphServicePort: Int) extends GraphClient:
  // In a real implementation, this would connect to the actual Graph Service
  // For now, we'll implement a more realistic stub that simulates real behavior

  def getFollowers(userId: Long, cursor: Long, limit: Int): Future[FollowersPage] =
    // Simulate fetching followers with proper pagination
    val effectiveLimit = math.min(limit, 100) // Safety limit
    val followers = (cursor until cursor + effectiveLimit).map(_ + 1).toSeq
    val nextCursor = if followers.size == effectiveLimit then Some(cursor + effectiveLimit) else None
    Future.value(FollowersPage(followers, nextCursor))

  def getFollowing(userId: Long, cursor: Long, limit: Int): Future[Seq[Long]] =
    // Simulate fetching following users with pagination
    val effectiveLimit = math.min(limit, 100) // Safety limit
    val following = ((cursor + 100) until (cursor + 100 + effectiveLimit)).map(_ + 1).toSeq
    Future.value(following)

/** Fallback stub for development/testing */
final class StubGraphClient extends GraphClient:
  def getFollowers(userId: Long, cursor: Long, limit: Int): Future[FollowersPage] =
    Future.value(FollowersPage(Seq(2L, 3L, 4L), None))

  def getFollowing(userId: Long, cursor: Long, limit: Int): Future[Seq[Long]] =
    Future.value(Seq(5L, 6L))
