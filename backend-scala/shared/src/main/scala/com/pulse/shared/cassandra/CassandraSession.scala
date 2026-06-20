package com.pulse.shared.cassandra

import com.datastax.oss.driver.api.core.CqlSession
import com.datastax.oss.driver.api.core.cql.{PreparedStatement, Row}
import com.twitter.util.Future
import java.net.InetSocketAddress
import scala.jdk.CollectionConverters.*

trait CassandraClient:
  def execute(query: String, values: AnyRef*): Future[Unit]
  def query(query: String, values: AnyRef*): Future[Seq[Row]]
  def prepare(query: String): PreparedStatement

final class CassandraSession(hosts: String, keyspace: String) extends CassandraClient:
  private val session: CqlSession = CqlSession.builder()
    .addContactPoint(InetSocketAddress(hosts, 9042))
    .withLocalDatacenter("datacenter1")
    .withKeyspace(keyspace)
    .build()

  def execute(query: String, values: AnyRef*): Future[Unit] =
    Future:
      session.execute(session.prepare(query).bind(values*))

  def query(query: String, values: AnyRef*): Future[Seq[Row]] =
    Future:
      session.execute(session.prepare(query).bind(values*)).all().asScala.toSeq

  def prepare(query: String): PreparedStatement =
    session.prepare(query)