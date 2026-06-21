package com.offme.shared.kafka

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import com.twitter.util.Future
import org.apache.kafka.clients.producer.{KafkaProducer, ProducerRecord, ProducerConfig}
import org.apache.kafka.common.serialization.StringSerializer
import java.util.Properties

/** Async event publisher — all state mutations emit to Kafka for downstream consumers.
  * Topics follow offme.<domain>.<event> convention (e.g. offme.posts.created).
  */
trait EventPublisher:
  def publish[T](topic: String, key: String, event: T): Future[Unit]

final class KafkaEventPublisher(bootstrapServers: String) extends EventPublisher:
  private val mapper = ObjectMapper().registerModule(DefaultScalaModule)

  private val producer = KafkaProducer[String, String](
    Properties:
      put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers)
      put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, classOf[StringSerializer].getName)
      put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, classOf[StringSerializer].getName)
      put(ProducerConfig.ACKS_CONFIG, "all")
      put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true")
      put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "lz4")
  )

  def publish[T](topic: String, key: String, event: T): Future[Unit] =
    Future:
      val json = mapper.writeValueAsString(event)
      val record = ProducerRecord(topic, key, json)
      producer.send(record).get()

object Topics:
  val PostCreated = "offme.posts.created"
  val PostDeleted = "offme.posts.deleted"
  val EngagementCreated = "offme.engagement.created"
  val FollowCreated = "offme.graph.follow.created"
  val FollowDeleted = "offme.graph.follow.deleted"
  val NotificationDispatch = "offme.notifications.dispatch"

final case class PostCreatedEvent(
    postId: Long,
    authorId: Long,
    text: String,
    postType: String,
    visibility: String,
    replyToId: Option[Long],
    quoteOfId: Option[Long],
    followerCount: Int,
    createdAt: Long,
    idempotencyKey: Option[String]
)

final case class FanoutCompletedEvent(
    postId: Long,
    authorId: Long,
    fanoutType: String, // "push" | "pull"
    recipientCount: Int,
    durationMs: Long
)