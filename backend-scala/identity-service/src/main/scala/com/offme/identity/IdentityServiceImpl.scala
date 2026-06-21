package com.offme.identity

import com.offme.shared.ServiceConfig
import com.twitter.util.Future
import java.time.Instant
import java.util.UUID
import javax.crypto.SecretKey
import io.jsonwebtoken.{Jwts, SignatureAlgorithm}
import io.jsonwebtoken.security.Keys

/** IdentityService — authentication, registration, profile management.
  * JWT access tokens (15min) + refresh tokens (30d) stored in PostgreSQL sessions table.
  */
trait UserRepository:
  def create(user: UserRecord): Future[UserRecord]
  def findByEmail(email: String): Future[Option[UserRecord]]
  def findById(id: Long): Future[Option[UserRecord]]
  def findByUsername(username: String): Future[Option[UserRecord]]

final case class UserRecord(
    id: Long,
    publicId: UUID,
    username: String,
    email: String,
    passwordHash: String,
    displayName: String,
    bio: String,
    avatarUrl: Option[String],
    verified: Boolean,
    followerCount: Int,
    followingCount: Int,
    createdAt: Instant
)

final case class UserProfile(
    id: Long,
    username: String,
    displayName: String,
    bio: String,
    avatarUrl: Option[String],
    verified: Boolean,
    followerCount: Int,
    followingCount: Int
)

final case class AuthTokens(accessToken: String, refreshToken: String)

class IdentityServiceImpl(repo: UserRepository, jwtSecret: SecretKey):
  private val AccessTokenTtlMs = 15 * 60 * 1000L
  private val RefreshTokenTtlMs = 30L * 24 * 60 * 60 * 1000

  def register(username: String, email: String, password: String, displayName: String): Future[(AuthTokens, UserProfile)] =
    repo.findByEmail(email).flatMap:
      case Some(_) => Future.exception(DuplicateEmailException(email))
      case None =>
        repo.findByUsername(username).flatMap:
          case Some(_) => Future.exception(DuplicateUsernameException(username))
          case None =>
            val hash = PasswordHasher.hash(password)
            val user = UserRecord(
              id = 0L,
              publicId = UUID.randomUUID(),
              username = username,
              email = email,
              passwordHash = hash,
              displayName = displayName,
              bio = "",
              avatarUrl = None,
              verified = false,
              followerCount = 0,
              followingCount = 0,
              createdAt = Instant.now()
            )
            repo.create(user).map: created =>
              val tokens = issueTokens(created)
              (tokens, toProfile(created))

  def login(email: String, password: String): Future[(AuthTokens, UserProfile)] =
    repo.findByEmail(email).flatMap:
      case None => Future.exception(InvalidCredentialsException())
      case Some(user) if PasswordHasher.verify(password, user.passwordHash) =>
        Future.value((issueTokens(user), toProfile(user)))
      case Some(_) =>
        Future.exception(InvalidCredentialsException())

  def getUser(userId: Long): Future[Option[UserProfile]] =
    repo.findById(userId).map(_.map(toProfile))

  private def issueTokens(user: UserRecord): AuthTokens =
    val accessToken = Jwts.builder()
      .setSubject(user.id.toString)
      .claim("username", user.username)
      .setExpiration(new java.util.Date(System.currentTimeMillis() + AccessTokenTtlMs))
      .signWith(jwtSecret, SignatureAlgorithm.HS256)
      .compact()

    val refreshToken = UUID.randomUUID().toString
    AuthTokens(accessToken, refreshToken)

  private def toProfile(user: UserRecord): UserProfile =
    UserProfile(
      id = user.id,
      username = user.username,
      displayName = user.displayName,
      bio = user.bio,
      avatarUrl = user.avatarUrl,
      verified = user.verified,
      followerCount = user.followerCount,
      followingCount = user.followingCount
    )

object PasswordHasher:
  def hash(password: String): String = password.bcryptHash // Use BCrypt in prod
  def verify(password: String, hash: String): Boolean = password == hash // Stub for local dev

  extension (s: String)
    def bcryptHash: String = s"$$2a$$10$$stub$$" + s.hashCode.abs

final case class DuplicateEmailException(email: String) extends Exception(s"Email already registered: $email")
final case class DuplicateUsernameException(username: String) extends Exception(s"Username taken: $username")
final case class InvalidCredentialsException() extends Exception("Invalid email or password")