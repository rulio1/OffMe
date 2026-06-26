package com.offme.monitoring

import com.twitter.finagle.stats.StatsReceiver
import com.twitter.util.Duration
import io.prometheus.client._
import io.prometheus.client.hotspot._

/**
 * OffMe Monitoring and Metrics System
 *
 * This class provides a comprehensive monitoring system that integrates with:
 * - Finagle StatsReceiver (for internal Finagle metrics)
 * - Prometheus (for external monitoring and dashboards)
 * - JVM metrics (memory, GC, threads, etc.)
 *
 * Usage:
 *   val metrics = new Metrics("my-service")
 *   metrics.counter("requests_total").inc()
 *   metrics.histogram("request_latency_seconds").observe(0.123)
 *   metrics.gauge("active_connections").set(42)
 */
class Metrics(serviceName: String) {
  // Prometheus registry
  private val registry = CollectorRegistry.defaultRegistry

  // Finagle stats receiver (for internal Twitter Server metrics)
  private val statsReceiver: StatsReceiver = com.twitter.finagle.stats.DefaultStatsReceiver.scope(serviceName)

  // Initialize JVM metrics
  initializeJvmMetrics()

  /**
   * Create or get a counter metric
   */
  def counter(name: String, help: String = ""): Counter = {
    val fullName = s"${serviceName}_$name"
    Counter.build()
      .name(fullName)
      .help(if (help.nonEmpty) help else s"$serviceName $name")
      .register(registry)
  }

  /**
   * Create or get a gauge metric
   */
  def gauge(name: String, help: String = ""): Gauge = {
    val fullName = s"${serviceName}_$name"
    Gauge.build()
      .name(fullName)
      .help(if (help.nonEmpty) help else s"$serviceName $name")
      .register(registry)
  }

  /**
   * Create or get a histogram metric
   */
  def histogram(name: String, help: String = "", buckets: Array[Double] = Histogram.DEFAULT_BUCKETS): Histogram = {
    val fullName = s"${serviceName}_$name"
    Histogram.build()
      .name(fullName)
      .help(if (help.nonEmpty) help else s"$serviceName $name")
      .buckets(buckets: _*)
      .register(registry)
  }

  /**
   * Create or get a summary metric
   */
  def summary(name: String, help: String = ""): Summary = {
    val fullName = s"${serviceName}_$name"
    Summary.build()
      .name(fullName)
      .help(if (help.nonEmpty) help else s"$serviceName $name")
      .register(registry)
  }

  /**
   * Record a business metric (counter)
   */
  def recordBusinessMetric(metricName: String, value: Double = 1.0): Unit = {
    counter(metricName).inc(value)
  }

  /**
   * Record request latency
   */
  def recordRequestLatency(metricName: String, duration: Duration): Unit = {
    histogram(s"${metricName}_latency_seconds").observe(duration.inSeconds)
  }

  /**
   * Record error
   */
  def recordError(metricName: String, errorType: String = "unknown"): Unit = {
    counter(s"${metricName}_errors_total").inc()
    counter(s"${metricName}_${errorType}_errors_total").inc()
  }

  /**
   * Initialize JVM metrics for monitoring
   */
  private def initializeJvmMetrics(): Unit = {
    // Standard JVM metrics
    DefaultExports.initialize()

    // Memory pools
    new MemoryPoolsExports().register(registry)

    // Garbage collection
    new GarbageCollectorExports().register(registry)

    // Threads
    new ThreadExports().register(registry)

    // Class loading
    new ClassLoadingExports().register(registry)

    // Version info
    new VersionInfoExports().register(registry)
  }

  /**
   * Get Prometheus metrics in text format (for HTTP endpoint)
   */
  def getPrometheusMetrics: String = {
    val writer = new java.io.StringWriter()
    TextFormat.write004(writer, registry.metricFamilySamples())
    writer.toString
  }

  /**
   * Finagle stats receiver methods for compatibility
   */
  def finagleCounter(name: String): com.twitter.finagle.stats.Counter = {
    statsReceiver.counter(name)
  }

  def finagleGauge(name: String): com.twitter.finagle.stats.Gauge = {
    statsReceiver.gauge(name)
  }

  def finagleStat(name: String): com.twitter.finagle.stats.Stat = {
    statsReceiver.stat(name)
  }

  /**
   * Standard metric names for consistency across services
   */
  object StandardMetrics {
    val REQUEST_COUNT = "requests_total"
    val REQUEST_LATENCY = "request_latency_seconds"
    val REQUEST_ERRORS = "request_errors_total"
    val ACTIVE_CONNECTIONS = "active_connections"
    val DB_QUERY_TIME = "db_query_time_seconds"
    val CACHE_HITS = "cache_hits_total"
    val CACHE_MISSES = "cache_misses_total"
    val SERVICE_UP = "up"
  }
}

/**
 * Companion object for easy access to global metrics
 */
object Metrics {
  // Global metrics registry
  private val serviceMetrics = new java.util.concurrent.ConcurrentHashMap[String, Metrics]()

  /**
   * Get or create a Metrics instance for a service
   */
  def apply(serviceName: String): Metrics = {
    serviceMetrics.computeIfAbsent(serviceName, new Metrics(_))
  }

  /**
   * Get global metrics instance (for shared metrics)
   */
  def global: Metrics = apply("offme_global")

  /**
   * Initialize Prometheus HTTP server for metrics exposure
   */
  def startPrometheusServer(port: Int = 9091): Unit = {
    import com.twitter.finagle.Http
    import com.twitter.server.TwitterServer
    import com.twitter.util.Await

    val server = Http.server
      .withLabel("prometheus")
      .serve(s":$port", new PrometheusService())
      .onSuccess { server =>
        println(s"Prometheus metrics server started on port $port")
      }
      .onFailure { cause =>
        println(s"Failed to start Prometheus metrics server: $cause")
      }

    // Keep the server running
    Await.ready(server)
  }

  /**
   * Prometheus HTTP service for exposing metrics
   */
  private class PrometheusService extends com.twitter.finagle.Service[com.twitter.finagle.http.Request, com.twitter.finagle.http.Response] {
    def apply(request: com.twitter.finagle.http.Request): com.twitter.util.Future[com.twitter.finagle.http.Response] = {
      val response = com.twitter.finagle.http.Response()
      response.setContentType("text/plain; version=0.0.4; charset=utf-8")

      try {
        val metrics = getPrometheusMetricsFromAllServices()
        response.setContentString(metrics)
        com.twitter.util.Future.value(response)
      } catch {
        case e: Exception =>
          response.setStatus(com.twitter.finagle.http.Status.InternalServerError)
          response.setContentString(s"Error generating metrics: ${e.getMessage}")
          com.twitter.util.Future.value(response)
      }
    }

    private def getPrometheusMetricsFromAllServices(): String = {
      val writer = new java.io.StringWriter()
      TextFormat.write004(writer, CollectorRegistry.defaultRegistry.metricFamilySamples())
      writer.toString
    }
  }
}