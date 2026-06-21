package com.offme.timeline

import com.offme.shared.TimelineEntry
import com.twitter.finagle.Http
import com.twitter.finagle.http.{Method, Request, Status}
import com.twitter.util.Future
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule

/** HomeMixerClient — calls Python Home Mixer + Rust Heavy Ranker for For You timeline.
  * In production this is a dedicated Scala service; wired here for Timeline Service integration.
  */
trait HomeMixerClient:
  def getForYou(userId: Long, limit: Int): Future[Seq[TimelineEntry]]

final class HttpHomeMixerClient(recsServingUrl: String) extends HomeMixerClient:
  private val client = Http.newService(recsServingUrl)
  private val mapper = ObjectMapper().registerModule(DefaultScalaModule)

  def getForYou(userId: Long, limit: Int): Future[Seq[TimelineEntry]] =
    // 1. Gather candidates (in prod: dedicated Home Mixer service)
    // 2. Call Rust ranker
    // 3. Apply heuristics
    // 4. Return as TimelineEntry sequence
    val req = Request(Method.Post, "/v1/rank")
    req.setContentTypeJson()
    req.contentString = mapper.writeValueAsString(Map(
      "user_id" -> userId,
      "candidate_post_ids" -> (1 to 100),
      "candidate_author_ids" -> (1 to 100).map(_ + 1000),
      "request_id" -> s"tl-fy-$userId"
    ))

    client(req).map: resp =>
      if resp.status != Status.Ok then Seq.empty
      else
        // Parse ranked response into TimelineEntry
        Seq.empty // Wire JSON parsing in production