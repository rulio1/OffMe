package com.offme.identity

import com.offme.shared.ServiceConfig
import com.twitter.finagle.Thrift
import com.twitter.server.TwitterServer
import com.twitter.util.Await
import io.jsonwebtoken.security.Keys
import java.nio.charset.StandardCharsets

object IdentityServiceMain extends TwitterServer:
  def main(): Unit =
    val config = ServiceConfig.fromEnv()
    val jwtSecret = Keys.hmacShaKeyFor(config.jwtSecret.getBytes(StandardCharsets.UTF_8))
    val repo = new PostgresUserRepository(config)
    val service = new IdentityServiceImpl(repo, jwtSecret)

    val server = Thrift.server
      .withLabel("identity-service")
      .serveIface(s"${config.host}:${config.port}", service)

    onExit { server.close() }

    Await.ready(adminHttpServer)