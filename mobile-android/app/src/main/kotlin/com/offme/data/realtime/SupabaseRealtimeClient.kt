package com.offme.data.realtime

import com.offme.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit

/**
 * Cliente mínimo Phoenix/Supabase Realtime para postgres_changes.
 * Espelha a implementação iOS [SupabaseRealtimeClient].
 */
class SupabaseRealtimeClient private constructor() {
    private val executor = Executors.newSingleThreadExecutor()
    private val scheduler = Executors.newSingleThreadScheduledExecutor()
    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private var ref = 0
    private var heartbeatFuture: ScheduledFuture<*>? = null
    private val onChangeHandlers = ConcurrentHashMap<String, () -> Unit>()
    private var accessToken: String? = null

    fun subscribe(
        channelKey: String,
        table: String,
        filter: String,
        accessToken: String,
        onChange: () -> Unit,
    ) {
        executor.execute {
            onChangeHandlers[channelKey] = onChange
            this.accessToken = accessToken
            connectIfNeeded()
            joinChannel(topic = "realtime:public:$table", table = table, filter = filter)
        }
    }

    fun unsubscribe(channelKey: String) {
        executor.execute {
            onChangeHandlers.remove(channelKey)
            if (onChangeHandlers.isEmpty()) {
                disconnect()
            }
        }
    }

    private fun connectIfNeeded() {
        if (webSocket != null) return
        val url = websocketUrl ?: return

        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                handleMessage(text)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                executor.execute {
                    this@SupabaseRealtimeClient.webSocket = null
                }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                executor.execute {
                    this@SupabaseRealtimeClient.webSocket = null
                }
            }
        })
        startHeartbeat()
    }

    private fun disconnect() {
        heartbeatFuture?.cancel(false)
        heartbeatFuture = null
        webSocket?.close(1000, "going away")
        webSocket = null
    }

    private fun nextRef(): String {
        ref += 1
        return ref.toString()
    }

    private fun joinChannel(topic: String, table: String, filter: String) {
        val refValue = nextRef()
        val change = JSONObject().apply {
            put("event", "INSERT")
            put("schema", "public")
            put("table", table)
            if (filter.isNotEmpty()) {
                put("filter", filter)
            }
        }

        val payload = JSONObject().apply {
            put("config", JSONObject().put("postgres_changes", JSONArray().put(change)))
            put("access_token", accessToken.orEmpty())
        }

        send(topic = topic, event = "phx_join", payload = payload, ref = refValue)
    }

    private fun send(topic: String, event: String, payload: JSONObject, ref: String) {
        val message = JSONArray().apply {
            put(ref)
            put(ref)
            put(topic)
            put(event)
            put(payload)
        }
        webSocket?.send(message.toString())
    }

    private fun handleMessage(text: String) {
        try {
            val json = JSONArray(text)
            if (json.length() < 5) return

            val event = json.optString(3)
            if (event == "postgres_changes" || event == "INSERT") {
                notifyHandlers()
            }

            val payload = json.optJSONObject(4) ?: return
            val data = payload.optJSONObject("data") ?: return
            if (data.optString("type") == "INSERT") {
                notifyHandlers()
            }
        } catch (_: Exception) {
            // Ignore malformed messages.
        }
    }

    private fun notifyHandlers() {
        onChangeHandlers.values.forEach { handler ->
            try {
                handler()
            } catch (_: Exception) {
                // Ignore handler failures.
            }
        }
    }

    private fun startHeartbeat() {
        heartbeatFuture?.cancel(false)
        heartbeatFuture = scheduler.scheduleAtFixedRate({
            val ws = webSocket ?: return@scheduleAtFixedRate
            val refValue = nextRef()
            val message = JSONArray().apply {
                put(JSONObject.NULL)
                put(refValue)
                put("phoenix")
                put("heartbeat")
                put(JSONObject())
            }
            ws.send(message.toString())
        }, 25, 25, TimeUnit.SECONDS)
    }

    companion object {
        val instance: SupabaseRealtimeClient by lazy { SupabaseRealtimeClient() }

        private val websocketUrl: String?
            get() {
                val url = BuildConfig.SUPABASE_URL.trim()
                val key = BuildConfig.SUPABASE_ANON_KEY.trim()
                if (url.isEmpty() || key.isEmpty()) return null

                val base = url.removeSuffix("/")
                return "$base/realtime/v1/websocket?apikey=$key&vsn=1.0.0"
                    .replace("https://", "wss://")
                    .replace("http://", "ws://")
            }

        val isConfigured: Boolean
            get() = BuildConfig.SUPABASE_URL.isNotBlank() &&
                BuildConfig.SUPABASE_ANON_KEY.isNotBlank()
    }
}