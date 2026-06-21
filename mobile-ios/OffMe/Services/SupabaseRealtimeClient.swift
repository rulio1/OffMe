import Foundation

/// Cliente mínimo Phoenix/Supabase Realtime para postgres_changes.
final class SupabaseRealtimeClient: @unchecked Sendable {
    static let shared = SupabaseRealtimeClient()

    private let queue = DispatchQueue(label: "com.offme.supabase-realtime")
    private var task: URLSessionWebSocketTask?
    private var ref = 0
    private var heartbeatTimer: DispatchSourceTimer?
    private var onChangeHandlers: [String: () -> Void] = [:]
    private var accessToken: String?

    private init() {}

    func subscribe(
        channelKey: String,
        table: String,
        filter: String,
        accessToken: String,
        onChange: @escaping () -> Void
    ) {
        queue.async {
            self.onChangeHandlers[channelKey] = onChange
            self.accessToken = accessToken
            self.connectIfNeeded()
            self.joinChannel(topic: "realtime:public:\(table)", table: table, filter: filter)
        }
    }

    func unsubscribe(channelKey: String) {
        queue.async {
            self.onChangeHandlers.removeValue(forKey: channelKey)
            if self.onChangeHandlers.isEmpty {
                self.disconnect()
            }
        }
    }

    private func connectIfNeeded() {
        guard task == nil, let url = SupabaseConfig.websocketURL else { return }

        let session = URLSession(configuration: .default)
        let ws = session.webSocketTask(with: url)
        task = ws
        ws.resume()
        listen()
        startHeartbeat()
    }

    private func disconnect() {
        heartbeatTimer?.cancel()
        heartbeatTimer = nil
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
    }

    private func nextRef() -> String {
        ref += 1
        return String(ref)
    }

    private func joinChannel(topic: String, table: String, filter: String) {
        let ref = nextRef()
        var change: [String: Any] = [
            "event": "INSERT",
            "schema": "public",
            "table": table,
        ]
        if !filter.isEmpty {
            change["filter"] = filter
        }

        let payload: [String: Any] = [
            "config": [
                "postgres_changes": [change],
            ],
            "access_token": accessToken ?? "",
        ]

        send(topic: topic, event: "phx_join", payload: payload, ref: ref)
    }

    private func send(topic: String, event: String, payload: [String: Any], ref: String) {
        guard let data = try? JSONSerialization.data(withJSONObject: [
            ref, ref, topic, event, payload,
        ]) else { return }

        task?.send(.string(String(data: data, encoding: .utf8)!)) { _ in }
    }

    private func listen() {
        task?.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let message):
                if case .string(let text) = message {
                    self.handleMessage(text)
                }
            case .failure:
                self.queue.async {
                    self.task = nil
                }
            }
            self.listen()
        }
    }

    private func handleMessage(_ text: String) {
        guard
            let data = text.data(using: .utf8),
            let json = try? JSONSerialization.jsonObject(with: data) as? [Any],
            json.count >= 5,
            let event = json[3] as? String
        else { return }

        if event == "postgres_changes" || event == "INSERT" {
            DispatchQueue.main.async {
                self.onChangeHandlers.values.forEach { $0() }
            }
        }

        if let payload = json[4] as? [String: Any],
           let nested = payload["data"] as? [String: Any],
           nested["type"] as? String == "INSERT" {
            DispatchQueue.main.async {
                self.onChangeHandlers.values.forEach { $0() }
            }
        }
    }

    private func startHeartbeat() {
        heartbeatTimer?.cancel()
        let timer = DispatchSource.makeTimerSource(queue: queue)
        timer.schedule(deadline: .now() + 25, repeating: 25)
        timer.setEventHandler { [weak self] in
            guard let self, let task = self.task else { return }
            let ref = self.nextRef()
            if let data = try? JSONSerialization.data(withJSONObject: [
                NSNull(), ref, "phoenix", "heartbeat", [:] as [String: Any],
            ]) {
                task.send(.string(String(data: data, encoding: .utf8)!)) { _ in }
            }
        }
        timer.resume()
        heartbeatTimer = timer
    }
}