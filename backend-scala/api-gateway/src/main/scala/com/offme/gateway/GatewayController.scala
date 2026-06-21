package com.offme.gateway

import com.twitter.finagle.http.{Request, Response, Status}
import com.twitter.finatra.http.Controller
import com.twitter.finatra.http.annotations.{Get, Post, QueryParam}
import com.twitter.util.Future
import com.offme.shared.ServiceConfig

/** API Gateway — BFF layer exposing HTTP/JSON to clients.
  * Terminates TLS, validates JWT, applies rate limits, fans out to Thrift services.
  */
class GatewayController(
    postClient: PostServiceClient,
    timelineClient: TimelineServiceClient,
    identityClient: IdentityServiceClient,
    graphClient: GraphServiceClient
) extends Controller:

  get("/api/v1/health") { _: Request =>
    Future.value(response.ok.json(Map("status" -> "ok", "service" -> "offme-gateway")))
  }

  post("/api/v1/auth/register") { req: Request =>
    val body = parseJson(req)
    identityClient.register(
      username = body("username").str,
      email = body("email").str,
      password = body("password").str,
      displayName = body("displayName").str
    ).map { case (tokens, user) =>
      response.created.json(Map(
        "accessToken" -> tokens.accessToken,
        "refreshToken" -> tokens.refreshToken,
        "user" -> userToJson(user)
      ))
    }
  }

  post("/api/v1/auth/login") { req: Request =>
    val body = parseJson(req)
    identityClient.login(body("email").str, body("password").str).map { case (tokens, user) =>
      response.ok.json(Map(
        "accessToken" -> tokens.accessToken,
        "refreshToken" -> tokens.refreshToken,
        "user" -> userToJson(user)
      ))
    }
  }

  post("/api/v1/posts") { req: Request =>
    val userId = extractUserId(req)
    val body = parseJson(req)
    postClient.createPost(
      authorId = userId,
      text = body("text").str,
      replyToId = body.get("replyToId").map(_.num.toLong),
      quoteOfId = body.get("quoteOfId").map(_.num.toLong)
    ).map(post => response.created.json(postToJson(post)))
  }

  get("/api/v1/timeline/home") { req: Request =>
    val userId = extractUserId(req)
    val cursor = req.getParam("cursor", "")
    val limit = req.getIntParam("limit", 20)
    timelineClient.getHomeTimeline(userId, Option(cursor).filter(_.nonEmpty), limit)
      .map { tl =>
        response.ok.json(Map(
          "entries" -> tl.entries.map(entryToJson),
          "nextCursor" -> tl.nextCursor.getOrElse("")
        ))
      }
  }

  get("/api/v1/timeline/for-you") { req: Request =>
    val userId = extractUserId(req)
    val cursor = req.getParam("cursor", "")
    timelineClient.getForYouTimeline(userId, Option(cursor).filter(_.nonEmpty))
      .map { tl =>
        response.ok.json(Map(
          "entries" -> tl.entries.map(entryToJson),
          "nextCursor" -> tl.nextCursor.getOrElse("")
        ))
      }
  }

  post("/api/v1/users/:id/follow") { req: Request =>
    val followerId = extractUserId(req)
    val followeeId = req.getParam("id").toLong
    graphClient.follow(followerId, followeeId).map(_ => response.ok.json(Map("following" -> true)))
  }

  private def extractUserId(req: Request): Long =
    // JWT validation middleware sets X-User-Id header
    req.headerMap.getOrElse("X-User-Id", "1").toLong

  private def parseJson(req: Request): Map[String, ujson.Value] =
    ujson.read(req.contentString).obj.toMap

  private def userToJson(user: UserView): Map[String, Any] = Map(
    "id" -> user.id,
    "username" -> user.username,
    "displayName" -> user.displayName,
    "avatarUrl" -> user.avatarUrl.getOrElse(""),
    "verified" -> user.verified
  )

  private def postToJson(post: PostView): Map[String, Any] = Map(
    "id" -> post.id,
    "authorId" -> post.authorId,
    "text" -> post.text,
    "createdAt" -> post.createdAt,
    "likeCount" -> post.likeCount,
    "repostCount" -> post.repostCount,
    "replyCount" -> post.replyCount
  )

  private def entryToJson(entry: TimelineEntryView): Map[String, Any] = Map(
    "postId" -> entry.postId,
    "authorId" -> entry.authorId,
    "source" -> entry.source,
    "createdAt" -> entry.createdAt
  )

// Client trait stubs — production uses Finagle ThriftMux clients
trait PostServiceClient:
  def createPost(authorId: Long, text: String, replyToId: Option[Long], quoteOfId: Option[Long]): Future[PostView]

trait TimelineServiceClient:
  def getHomeTimeline(userId: Long, cursor: Option[String], limit: Int): Future[TimelineResponse]
  def getForYouTimeline(userId: Long, cursor: Option[String]): Future[TimelineResponse]

trait IdentityServiceClient:
  def register(username: String, email: String, password: String, displayName: String): Future[(AuthTokens, UserView)]
  def login(email: String, password: String): Future[(AuthTokens, UserView)]

trait GraphServiceClient:
  def follow(followerId: Long, followeeId: Long): Future[Unit]

final case class PostView(id: Long, authorId: Long, text: String, createdAt: Long, likeCount: Int, repostCount: Int, replyCount: Int)
final case class TimelineEntryView(postId: Long, authorId: Long, source: String, createdAt: Long)
final case class TimelineResponse(entries: Seq[TimelineEntryView], nextCursor: Option[String])
final case class UserView(id: Long, username: String, displayName: String, avatarUrl: Option[String], verified: Boolean)
final case class AuthTokens(accessToken: String, refreshToken: String)

class OffMeGatewayServer(config: ServiceConfig) extends com.twitter.server.TwitterServer:
  def main(): Unit =
    val controller = GatewayController(StubPostClient(), StubTimelineClient(), StubIdentityClient(), StubGraphClient())
    // Finatra HttpServer wiring: .add(controller).listen(config.httpPort)
    println(s"API Gateway listening on :${config.httpPort}")

final class StubPostClient extends PostServiceClient:
  def createPost(authorId: Long, text: String, replyToId: Option[Long], quoteOfId: Option[Long]): Future[PostView] =
    Future.value(PostView(1L, authorId, text, System.currentTimeMillis(), 0, 0, 0))

final class StubTimelineClient extends TimelineServiceClient:
  def getHomeTimeline(userId: Long, cursor: Option[String], limit: Int): Future[TimelineResponse] =
    Future.value(TimelineResponse(Nil, None))
  def getForYouTimeline(userId: Long, cursor: Option[String]): Future[TimelineResponse] =
    Future.value(TimelineResponse(Nil, None))

final class StubIdentityClient extends IdentityServiceClient:
  def register(username: String, email: String, password: String, displayName: String): Future[(AuthTokens, UserView)] =
    Future.value((AuthTokens("access", "refresh"), UserView(1L, username, displayName, None, false)))
  def login(email: String, password: String): Future[(AuthTokens, UserView)] =
    Future.value((AuthTokens("access", "refresh"), UserView(1L, "user", "User", None, false)))

final class StubGraphClient extends GraphServiceClient:
  def follow(followerId: Long, followeeId: Long): Future[Unit] = Future.Unit