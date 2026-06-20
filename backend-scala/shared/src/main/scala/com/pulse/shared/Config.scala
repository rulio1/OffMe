package com.pulse.shared

import com.twitter.util.Duration

/** Service configuration loaded from environment variables.
  * Mirrors Twitter's configbus pattern — 12-factor, no hardcoded secrets.
  */
final case class ServiceConfig(
    serviceName: String,
    thriftPort: Int,
    httpPort: Int,
    postgresUrl: String,
    cassandraHosts: String,
    cassandraKeyspace: String,
    redisHost: String,
    redisPort: Int,
    kafkaBootstrap: String,
    zipkinEndpoint: String,
    celebrityFollowerThreshold: Int = 10_000,
    timelinePageSize: Int = 20,
    fanoutBatchSize: Int = 500,
    rpcTimeout: Duration = Duration.fromSeconds(3)
)

object ServiceConfig:
  def load(serviceName: String): ServiceConfig =
    ServiceConfig(
      serviceName = serviceName,
      thriftPort = envInt("THRIFT_PORT", 8081),
      httpPort = envInt("HTTP_PORT", 8080),
      postgresUrl = env("POSTGRES_URL", "jdbc:postgresql://localhost:5432/pulse"),
      cassandraHosts = env("CASSANDRA_HOSTS", "localhost"),
      cassandraKeyspace = env("CASSANDRA_KEYSPACE", "pulse"),
      redisHost = env("REDIS_HOST", "localhost"),
      redisPort = envInt("REDIS_PORT", 6379),
      kafkaBootstrap = env("KAFKA_BOOTSTRAP", "localhost:9092"),
      zipkinEndpoint = env("ZIPKIN_ENDPOINT", "http://localhost:9411/api/v2/spans"),
      celebrityFollowerThreshold = envInt("CELEBRITY_THRESHOLD", 10_000),
      timelinePageSize = envInt("TIMELINE_PAGE_SIZE", 20),
      fanoutBatchSize = envInt("FANOUT_BATCH_SIZE", 500)
    )

  private def env(key: String, default: String): String =
    Option(System.getenv(key)).filter(_.nonEmpty).getOrElse(default)

  private def envInt(key: String, default: Int): Int =
    env(key, default.toString).toInt