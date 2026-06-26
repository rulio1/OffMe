package com.offme.identity

import com.offme.shared.ServiceConfig
import com.twitter.finagle.Thrift
import com.twitter.server.TwitterServer
import com.twitter.util.Await
import io.jsonwebtoken.security.Keys
import java.nio.charset.StandardCharsets
import java.util.concurrent.atomic.AtomicReference

object IdentityServiceMain extends TwitterServer:
  def main(): Unit =
    val config = ServiceConfig.load("identity-service")

    // Initialize JWT secret manager with rotation support
    val jwtSecretManager = new JwtSecretManager(config.jwtSecret)

    val repo = new PostgresUserRepository(config)
    val service = new IdentityServiceImpl(repo, jwtSecretManager.getCurrentSecret)

    val server = Thrift.server
      .withLabel("identity-service")
      .serveIface(s"${config.thriftPort}", service)

    onExit { server.close() }

    Await.ready(adminHttpServer)
