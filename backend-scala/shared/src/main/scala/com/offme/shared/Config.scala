package com.offme.shared

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
    rpcTimeout: Duration = Duration.fromSeconds(3),
    jwtSecret: String = "",
    graphServiceHost: String = "localhost",
    graphServicePort: Int = 8082,
    featureFlags: Map[String, Boolean] = Map.empty,
    environment: String = "development"
)

object ServiceConfig:
  def load(serviceName: String): ServiceConfig = {
    // Load basic configuration
    val config = ServiceConfig(
      serviceName = serviceName,
      thriftPort = envInt("THRIFT_PORT", 8081),
      httpPort = envInt("HTTP_PORT", 8080),
      postgresUrl = env("POSTGRES_URL", "jdbc:postgresql://localhost:5432/offme?user=offme&password=offme_dev"),
      cassandraHosts = env("CASSANDRA_HOSTS", "localhost"),
      cassandraKeyspace = env("CASSANDRA_KEYSPACE", "offme"),
      redisHost = env("REDIS_HOST", "localhost"),
      redisPort = envInt("REDIS_PORT", 6379),
      kafkaBootstrap = env("KAFKA_BOOTSTRAP", "localhost:9092"),
      zipkinEndpoint = env("ZIPKIN_ENDPOINT", "http://localhost:9411/api/v2/spans"),
      celebrityFollowerThreshold = envInt("CELEBRITY_THRESHOLD", 10_000),
      timelinePageSize = envInt("TIMELINE_PAGE_SIZE", 20),
      fanoutBatchSize = envInt("FANOUT_BATCH_SIZE", 500),
      jwtSecret = env("JWT_SECRET", ""),
      graphServiceHost = env("GRAPH_SERVICE_HOST", "localhost"),
      graphServicePort = envInt("GRAPH_SERVICE_PORT", 8082),
      featureFlags = parseFeatureFlags(env("FEATURE_FLAGS", "")),
      environment = env("ENVIRONMENT", "development")
    )

    // Validate required configuration based on service type
    validateConfiguration(config, serviceName)

    config
  }

  /** Parse feature flags from environment variable
    * Format: flag1=true,flag2=false,flag3=true
    */
  private def parseFeatureFlags(flagsString: String): Map[String, Boolean] = {
    if (flagsString.isEmpty) return Map.empty

    flagsString.split(",").flatMap: flag =>
      val parts = flag.split("=")
      if (parts.length == 2) {
        Some(parts(0).trim -> parts(1).trim.toBoolean)
      } else {
        None
      }
    }.toMap
  }

  /** Validate required configuration based on service type */
  private def validateConfiguration(config: ServiceConfig, serviceName: String): Unit = {
    val missingVars = collection.mutable.ListBuffer.empty[String]

    // Common required variables
    if (config.redisHost.isEmpty) missingVars += "REDIS_HOST"
    if (config.kafkaBootstrap.isEmpty) missingVars += "KAFKA_BOOTSTRAP"

    // Service-specific requirements
    serviceName match {
      case "identity-service" =>
        if (config.jwtSecret.isEmpty) missingVars += "JWT_SECRET"
        if (config.postgresUrl.isEmpty) missingVars += "POSTGRES_URL"

      case "timeline-service" =>
        if (config.cassandraHosts.isEmpty) missingVars += "CASSANDRA_HOSTS"
        if (config.graphServiceHost.isEmpty) missingVars += "GRAPH_SERVICE_HOST"

      case "graph-service" =>
        if (config.cassandraHosts.isEmpty) missingVars += "CASSANDRA_HOSTS"

      case _ =>
        // Other services have no additional requirements
    }

    if (missingVars.nonEmpty) {
      throw new IllegalStateException(
        s"Missing required environment variables for ${serviceName}: ${missingVars.mkString(", ")}"
      )
    }

    // Validate ports are in valid range
    Seq(config.thriftPort, config.httpPort, config.redisPort, config.graphServicePort)
      .foreach: port =>
        require(port > 0 && port < 65536, s"Invalid port number: $port")
  }

  private def env(key: String, default: String): String =
    Option(System.getenv(key)).filter(_.nonEmpty).getOrElse(default)

  private def envInt(key: String, default: Int): Int =
    env(key, default.toString).toInt
