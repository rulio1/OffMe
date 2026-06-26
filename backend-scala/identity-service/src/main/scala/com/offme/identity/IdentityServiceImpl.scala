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

import org.mindrot.jbcrypt.BCrypt

object PasswordHasher:
  // Enhanced password hashing with salt verification and parameter validation
  def hash(password: String): String = {
    require(password != null && password.nonEmpty, "Password cannot be null or empty")

    // Use BCrypt with work factor 10 (adjustable based on security requirements)
    val salt = BCrypt.gensalt(10)

    // Verify salt was generated correctly
    require(salt != null && salt.startsWith("$2a$10$"), "Salt generation failed")

    BCrypt.hashpw(password, salt)
  }

  def verify(password: String, hash: String): Boolean = {
    require(password != null && password.nonEmpty, "Password cannot be null or empty")
    require(hash != null && hash.nonEmpty, "Hash cannot be null or empty")

    // Verify the hash follows expected BCrypt format
    if (!hash.startsWith("$2a$") && !hash.startsWith("$2b$")) {
      throw new IllegalArgumentException("Invalid hash format")
    }

    BCrypt.checkpw(password, hash)
  }

  // Method to check if a hash needs rehashing (for password rotation)
  def needsRehash(hash: String): Boolean = {
    // Check if hash uses outdated work factor or algorithm
    !hash.startsWith("$2a$10$") && !hash.startsWith("$2b$10$")
  }

final case class DuplicateEmailException(email: String) extends Exception(s"Email already registered: $email")
final case class DuplicateUsernameException(username: String) extends Exception(s"Username taken: $username")
final case class InvalidCredentialsException() extends Exception("Invalid email or password")

/** JWT Secret Manager with rotation support
  *
  * Manages JWT secrets with the ability to rotate secrets while maintaining
  * backward compatibility for token validation.
  */
class JwtSecretManager(initialSecret: String):
  import java.util.concurrent.atomic.AtomicReference
  import io.jsonwebtoken.security.Keys
  import java.nio.charset.StandardCharsets
  import javax.crypto.SecretKey

  private val currentSecret = new AtomicReference[SecretKey](
    Keys.hmacShaKeyFor(initialSecret.getBytes(StandardCharsets.UTF_8))
  )
  private val previousSecret = new AtomicReference[Option[SecretKey]](None)

  /** Get the current active secret for signing new tokens */
  def getCurrentSecret: SecretKey = currentSecret.get()

  /** Rotate to a new JWT secret
    *
    * @param newSecret The new secret string
    * @return The new secret key
    */
  def rotateSecret(newSecret: String): SecretKey = {
    val newKey = Keys.hmacShaKeyFor(newSecret.getBytes(StandardCharsets.UTF_8))
    val oldKey = currentSecret.getAndSet(newKey)
    previousSecret.set(Some(oldKey))
    newKey
  }

  /** Validate a token against current or previous secret
    *
    * @param token The JWT token to validate
    * @return True if token is valid against current or previous secret
    */
  def validateToken(token: String): Boolean = {
    try {
      // Try current secret first
      Jwts.parserBuilder()
        .setSigningKey(getCurrentSecret)
        .build()
        .parseClaimsJws(token)
      true
    } catch {
      case _: Exception =>
        // Try previous secret if available
        previousSecret.get().exists: secret =>
          try {
            Jwts.parserBuilder()
              .setSigningKey(secret)
              .build()
              .parseClaimsJws(token)
            true
          } catch {
            case _: Exception => false
          }
    }
  }

  /** Check if secret rotation is needed
    *
    * @param rotationIntervalMs Recommended rotation interval
    * @return True if rotation is recommended
    */
  def needsRotation(rotationIntervalMs: Long = 30L * 24 * 60 * 60 * 1000): Boolean = {
    // In a real implementation, this would track secret age
    // For now, this is a placeholder for the rotation logic
    false
  }
