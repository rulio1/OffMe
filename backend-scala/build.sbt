ThisBuild / organization := "com.pulse"
ThisBuild / scalaVersion := "3.3.3"
ThisBuild / version := "0.1.0-SNAPSHOT"

lazy val commonSettings = Seq(
  libraryDependencies ++= Seq(
    "com.twitter" %% "finagle-core" % "24.2.0",
    "com.twitter" %% "finagle-thrift" % "24.2.0",
    "com.twitter" %% "finagle-http" % "24.2.0",
    "com.twitter" %% "finagle-redis" % "24.2.0",
    "com.twitter" %% "finatra-http" % "24.2.0",
    "com.twitter" %% "twitter-server" % "24.2.0",
    "com.twitter" %% "util-core" % "24.2.0",
    "com.twitter" %% "util-stats" % "24.2.0",
    "com.datastax.oss" % "java-driver-core" % "4.17.0",
    "org.postgresql" % "postgresql" % "42.7.3",
    "com.zaxxer" % "HikariCP" % "5.1.0",
    "org.apache.kafka" % "kafka-clients" % "3.7.0",
    "io.opentelemetry" % "opentelemetry-api" % "1.38.0",
    "ch.qos.logback" % "logback-classic" % "1.5.6",
    "org.scalatest" %% "scalatest" % "3.2.18" % Test
  ),
  scalacOptions ++= Seq(
    "-deprecation",
    "-feature",
    "-Xfatal-warnings"
  )
)

lazy val shared = (project in file("shared"))
  .settings(commonSettings)
  .settings(name := "pulse-shared")

lazy val postService = (project in file("post-service"))
  .dependsOn(shared)
  .settings(commonSettings)
  .settings(name := "pulse-post-service")

lazy val timelineService = (project in file("timeline-service"))
  .dependsOn(shared)
  .settings(commonSettings)
  .settings(name := "pulse-timeline-service")

lazy val graphService = (project in file("graph-service"))
  .dependsOn(shared)
  .settings(commonSettings)
  .settings(name := "pulse-graph-service")

lazy val identityService = (project in file("identity-service"))
  .dependsOn(shared)
  .settings(commonSettings)
  .settings(name := "pulse-identity-service")

lazy val apiGateway = (project in file("api-gateway"))
  .dependsOn(shared)
  .settings(commonSettings)
  .settings(name := "pulse-api-gateway")

lazy val root = (project in file("."))
  .aggregate(shared, postService, timelineService, graphService, identityService, apiGateway)
  .settings(name := "pulse-backend")