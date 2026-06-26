package com.offme.timeline

import com.offme.shared.{ServiceConfig, TimelineEntry}
import com.twitter.util.{Await, Future}
import org.scalatest.funsuite.AnyFunSuite
import org.scalatest.matchers.should.Matchers
import org.scalatest.BeforeAndAfter
import java.time.Instant

class TimelineServiceTest extends AnyFunSuite with Matchers with BeforeAndAfter:
  private var service: TimelineServiceImpl = _
  private var mockRepo: MockTimelineRepository = _
  private var mockCache: MockTimelineCache = _
  private var mockGraphClient: MockGraphClient = _
  private val config: ServiceConfig = ServiceConfig(
    serviceName = "test-timeline",
    thriftPort = 8081,
    httpPort = 8080,
    postgresUrl = "jdbc:postgresql://localhost:5432/offme_test",
    cassandraHosts = "localhost",
    cassandraKeyspace = "offme_test",
    redisHost = "localhost",
    redisPort = 6379,
    kafkaBootstrap = "localhost:9092",
    zipkinEndpoint = "http://localhost:9411/api/v2/spans",
    celebrityFollowerThreshold = 10000,
    timelinePageSize = 20,
    fanoutBatchSize = 500
  )

  before {
    mockRepo = new MockTimelineRepository()
    mockCache = new MockTimelineCache()
    mockGraphClient = new MockGraphClient()
    service = new TimelineServiceImpl(mockRepo, mockCache, mockGraphClient, config)
  }

  test("getHomeTimeline should return cached entries when available") {
    val cachedEntries = (1 to 25).map: i =>
      TimelineEntry(
        postId = i.toLong,
        authorId = 100L + i,
        createdAt = System.currentTimeMillis() - i * 1000,
        source = "following"
      )
    mockCache.setSegment(1L, 0, cachedEntries)

    val result = service.getHomeTimeline(1L, None, 20)
    val response = Await.result(result)

    response.entries.size shouldBe 20
    response.nextCursor shouldBe defined
  }

  test("getHomeTimeline should fetch from repository when cache is empty") {
    val dbEntries = (1 to 15).map: i =>
      TimelineEntry(
        postId = i.toLong,
        authorId = 200L + i,
        createdAt = System.currentTimeMillis() - i * 1000,
        source = "following"
      )
    mockRepo.setHomeTimeline(1L, dbEntries)

    val result = service.getHomeTimeline(1L, None, 20)
    val response = Await.result(result)

    response.entries.size shouldBe 15
    response.nextCursor shouldBe None
  }

  test("getHomeTimeline should merge pushed and pulled celebrity posts") {
    val pushedEntries = (1 to 10).map: i =>
      TimelineEntry(
        postId = i.toLong,
        authorId = 100L + i,
        createdAt = System.currentTimeMillis() - i * 1000,
        source = "following"
      )

    val celebrityEntries = (1 to 5).map: i =>
      TimelineEntry(
        postId = 100L + i,
        authorId = 1000L + i, // Celebrity user IDs
        createdAt = System.currentTimeMillis() - (i * 2000),
        source = "celebrity"
      )

    mockRepo.setHomeTimeline(1L, pushedEntries)
    mockGraphClient.setFollowing(1L, Seq(1000L, 1001L, 1002L, 1003L, 1004L))
    mockRepo.setUserTimelines((1000L to 1004L).map(id => (id, celebrityEntries.filter(_.authorId == id))).toMap)

    val result = service.getHomeTimeline(1L, None, 20)
    val response = Await.result(result)

    // Should have merged entries (10 pushed + 5 celebrity = 15)
    response.entries.size shouldBe 15
    // Should contain both regular and celebrity posts
    response.entries.exists(_.source == "following") shouldBe true
    response.entries.exists(_.source == "celebrity") shouldBe true
  }

  test("fanoutPost should handle push fanout for regular users") {
    val event = PostCreatedEvent(
      postId = 123L,
      authorId = 100L,
      createdAt = System.currentTimeMillis(),
      followerCount = 5000 // Below celebrity threshold
    )

    mockGraphClient.setFollowers(100L, (1 to 3).map(i => 200L + i))

    val result = service.fanoutPost(event)
    Await.result(result)

    // Should have fanned out to all followers
    mockRepo.fanoutCalls.size shouldBe 1
    val fanoutCall = mockRepo.fanoutCalls.head
    fanoutCall.followerIds should contain theSameElementsAs Seq(201L, 202L, 203L)
  }

  test("fanoutPost should handle pull fanout for celebrities") {
    val event = PostCreatedEvent(
      postId = 124L,
      authorId = 1000L,
      createdAt = System.currentTimeMillis(),
      followerCount = 15000 // Above celebrity threshold
    )

    val result = service.fanoutPost(event)
    Await.result(result)

    // Should not fan out to followers (pull model)
    mockRepo.fanoutCalls.size shouldBe 0
  }

  test("fanoutPost should handle batched fanout for large follower counts") {
    val event = PostCreatedEvent(
      postId = 125L,
      authorId = 200L,
      createdAt = System.currentTimeMillis(),
      followerCount = 2500 // Below celebrity threshold
    )

    // Set up multiple batches of followers
    val allFollowers = (1 to 600).map(i => 300L + i)
    mockGraphClient.setFollowers(200L, allFollowers.take(500)) // First batch
    mockGraphClient.setNextFollowers(200L, allFollowers.drop(500)) // Second batch

    val result = service.fanoutPost(event)
    Await.result(result)

    // Should have made multiple batched calls
    mockRepo.fanoutCalls.size shouldBe 2
    // All followers should be covered
    mockRepo.fanoutCalls.flatMap(_.followerIds).size shouldBe 600
  }

  test("pullCelebrityPosts should handle empty following list") {
    mockGraphClient.setFollowing(1L, Seq.empty)

    val result = service.pullCelebrityPosts(1L, 10)
    val posts = Await.result(result)

    posts shouldBe empty
  }

  test("pullCelebrityPosts should handle celebrity filtering") {
    // User follows 100 users, only 2 are celebrities (IDs ending with 0000)
    val allFollowing = (1 to 100).map: i =>
      if i % 10000 == 0 then 10000L + (i / 10000) else i.toLong
    mockGraphClient.setFollowing(1L, allFollowing)

    // Only users with IDs 10000L and 20000L should be considered celebrities
    val celebrityPosts1 = (1 to 3).map: i =>
      TimelineEntry(
        postId = 1000L + i,
        authorId = 10000L,
        createdAt = System.currentTimeMillis() - i * 1000,
        source = "celebrity"
      )

    val celebrityPosts2 = (1 to 2).map: i =>
      TimelineEntry(
        postId = 2000L + i,
        authorId = 20000L,
        createdAt = System.currentTimeMillis() - i * 1000,
        source = "celebrity"
      )

    mockRepo.setUserTimelines(Map(
      10000L -> celebrityPosts1,
      20000L -> celebrityPosts2
    ))

    val result = service.pullCelebrityPosts(1L, 10)
    val posts = Await.result(result)

    posts.size shouldBe 5 // 3 + 2 posts
    posts.forall(_.source == "celebrity") shouldBe true
  }

  test("mergeTimelines should deduplicate posts by ID") {
    val pushed = Seq(
      TimelineEntry(1L, 100L, System.currentTimeMillis(), "following"),
      TimelineEntry(2L, 101L, System.currentTimeMillis() - 1000, "following"),
      TimelineEntry(3L, 102L, System.currentTimeMillis() - 2000, "following")
    )

    val pulled = Seq(
      TimelineEntry(2L, 101L, System.currentTimeMillis() - 1000, "celebrity"), // Duplicate ID
      TimelineEntry(4L, 1000L, System.currentTimeMillis() - 500, "celebrity"),
      TimelineEntry(5L, 1001L, System.currentTimeMillis() - 1500, "celebrity")
    )

    val merged = service.mergeTimelines(pushed, pulled)

    merged.size shouldBe 4 // 3 unique IDs from pushed + 2 new from pulled
    // Should keep the first occurrence of each post ID
    merged.find(_.postId == 2L).get.source shouldBe "following"
  }

  test("decodeCursor should handle valid timestamps") {
    val timestamp = System.currentTimeMillis()
    val cursor = service.decodeCursor(timestamp.toString)

    cursor shouldBe defined
    cursor.get.toEpochMilli shouldBe timestamp
  }

  test("decodeCursor should handle invalid timestamps") {
    val cursor = service.decodeCursor("invalid")
    cursor shouldBe None
  }

  test("nextCursor should generate cursor when more entries available") {
    val entries = (1 to 25).map: i =>
      TimelineEntry(
        postId = i.toLong,
        authorId = 100L + i,
        createdAt = System.currentTimeMillis() - i * 1000,
        source = "following"
      )

    val cursor = service.nextCursor(entries, 20)
    cursor shouldBe defined
  }

  test("nextCursor should not generate cursor when no more entries") {
    val entries = (1 to 15).map: i =>
      TimelineEntry(
        postId = i.toLong,
        authorId = 100L + i,
        createdAt = System.currentTimeMillis() - i * 1000,
        source = "following"
      )

    val cursor = service.nextCursor(entries, 20)
    cursor shouldBe None
  }

  private class MockTimelineRepository extends TimelineRepository:
    private var homeTimelines: Map[Long, Seq[TimelineEntry]] = Map.empty
    private var userTimelines: Map[Long, Seq[TimelineEntry]] = Map.empty
    var fanoutCalls: List[FanoutCall] = List.empty

    def setHomeTimeline(userId: Long, entries: Seq[TimelineEntry]): Unit =
      homeTimelines = homeTimelines + (userId -> entries)

    def setUserTimelines(timelines: Map[Long, Seq[TimelineEntry]]): Unit =
      userTimelines = userTimelines ++ timelines

    def getHomeTimeline(userId: Long, limit: Int, before: Option[Instant]): Future[Seq[TimelineEntry]] =
      Future.value(homeTimelines.getOrElse(userId, Seq.empty).take(limit))

    def getUserTimeline(userId: Long, limit: Int, before: Option[Instant]): Future[Seq[TimelineEntry]] =
      Future.value(userTimelines.getOrElse(userId, Seq.empty).take(limit))

    def fanoutToFollowers(followerIds: Seq[Long], entry: TimelineEntry, createdAt: Instant): Future[Unit] = {
      fanoutCalls = fanoutCalls :+ FanoutCall(followerIds, entry)
      Future.Unit
    }

    def recordFanoutState(postId: Long, authorId: Long, fanoutType: String, followerCount: Int): Future[Unit] =
      Future.Unit

    case class FanoutCall(followerIds: Seq[Long], entry: TimelineEntry)

  private class MockTimelineCache extends TimelineCache:
    private var cache: Map[(Long, Int), Seq[TimelineEntry]] = Map.empty

    def setSegment(userId: Long, segment: Int, entries: Seq[TimelineEntry]): Future[Unit] = {
      cache = cache + ((userId, segment) -> entries)
      Future.Unit
    }

    def getSegment(userId: Long, segment: Int): Future[Seq[TimelineEntry]] =
      Future.value(cache.getOrElse((userId, segment), Seq.empty))

    def invalidate(userId: Long): Future[Unit] = Future.Unit

  private class MockGraphClient extends GraphClient:
    private var followersMap: Map[Long, (Seq[Long], Option[Long])] = Map.empty
    private var followingMap: Map[Long, Seq[Long]] = Map.empty

    def setFollowers(userId: Long, followerIds: Seq[Long], nextCursor: Option[Long] = None): Unit =
      followersMap = followersMap + (userId -> (followerIds, nextCursor))

    def setNextFollowers(userId: Long, followerIds: Seq[Long]): Unit =
      val (existing, _) = followersMap.getOrElse(userId, (Seq.empty, None))
      followersMap = followersMap + (userId -> (existing ++ followerIds, None))

    def setFollowing(userId: Long, followingIds: Seq[Long]): Unit =
      followingMap = followingMap + (userId -> followingIds)

    def getFollowers(userId: Long, cursor: Long, limit: Int): Future[FollowersPage] = {
      val (followerIds, nextCursor) = followersMap.getOrElse(userId, (Seq.empty, None))
      val effectiveLimit = math.min(limit, followerIds.size)
      val paginated = followerIds.drop(cursor.toInt).take(effectiveLimit)
      val newCursor = if paginated.size == effectiveLimit && cursor + effectiveLimit < followerIds.size
                      then Some(cursor + effectiveLimit)
                      else None
      Future.value(FollowersPage(paginated, newCursor))
    }

    def getFollowing(userId: Long, cursor: Long, limit: Int): Future[Seq[Long]] = {
      val followingIds = followingMap.getOrElse(userId, Seq.empty)
      Future.value(followingIds.drop(cursor.toInt).take(limit))
    }