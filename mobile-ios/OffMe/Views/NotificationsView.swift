import SwiftUI

@MainActor
final class NotificationsViewModel: ObservableObject {
    @Published var notifications: [AppNotification] = []
    @Published var unreadCount = 0
    @Published var isLoading = false
    @Published var error: String?

    func load(token: String, markRead: Bool = false) async {
        isLoading = notifications.isEmpty
        error = nil
        defer { isLoading = false }

        do {
            let res = try await APIClient.shared.fetchNotifications(token: token)
            notifications = res.notifications
            unreadCount = res.unreadCount
            if markRead && res.unreadCount > 0 {
                try await APIClient.shared.markNotificationsRead(token: token)
                unreadCount = 0
                notifications = notifications.map { n in
                    AppNotification(
                        id: n.id,
                        type: n.type,
                        postId: n.postId,
                        read: true,
                        createdAt: n.createdAt,
                        actor: n.actor
                    )
                }
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

extension AppNotification {
    var message: String {
        switch type {
        case "like": return "curtiu seu post"
        case "reply": return "respondeu seu post"
        case "follow": return "começou a seguir você"
        case "repost": return "repostou seu post"
        default: return "interagiu com você"
        }
    }

    var timeAgo: String {
        let date = Date(timeIntervalSince1970: TimeInterval(createdAt) / 1000)
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = Locale(identifier: "pt_BR")
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

struct NotificationsView: View {
    @EnvironmentObject private var auth: AuthStore
    @StateObject private var viewModel = NotificationsViewModel()
    @State private var reloadTask: Task<Void, Never>?

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.notifications.isEmpty {
                ProgressView("Carregando...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error = viewModel.error, viewModel.notifications.isEmpty {
                Text(error)
                    .foregroundStyle(.red)
                    .padding()
            } else if viewModel.notifications.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "bell")
                        .font(.largeTitle)
                        .foregroundStyle(OffMeTheme.muted)
                    Text("Nenhuma notificação ainda")
                        .foregroundStyle(OffMeTheme.muted)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List(viewModel.notifications) { notification in
                    NavigationLink {
                        destination(for: notification)
                    } label: {
                        HStack(spacing: 12) {
                            Circle()
                                .fill(OffMeTheme.surface)
                                .frame(width: 40, height: 40)

                            VStack(alignment: .leading, spacing: 4) {
                                Text("\(notification.actor.displayName) \(notification.message)")
                                    .font(.subheadline)
                                Text(notification.timeAgo)
                                    .font(.caption)
                                    .foregroundStyle(OffMeTheme.muted)
                            }

                            if !notification.read {
                                Circle()
                                    .fill(OffMeTheme.accent)
                                    .frame(width: 8, height: 8)
                            }
                        }
                        .listRowBackground(notification.read ? OffMeTheme.bg : OffMeTheme.surface.opacity(0.5))
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .background(OffMeTheme.bg)
        .navigationTitle("Notificações")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: String.self) { username in
            ProfileView(username: username)
        }
        .navigationDestination(for: Int.self) { postId in
            PostThreadView(postId: postId)
        }
        .task {
            if let token = auth.accessToken {
                await viewModel.load(token: token, markRead: true)
                subscribeRealtime(token: token)
            }
        }
        .onDisappear {
            SupabaseRealtimeClient.shared.unsubscribe(channelKey: "notifications")
        }
        .refreshable {
            if let token = auth.accessToken {
                await viewModel.load(token: token, markRead: true)
            }
        }
    }

    private func subscribeRealtime(token: String) {
        guard SupabaseConfig.isConfigured, let userId = auth.session?.user.id else { return }
        SupabaseRealtimeClient.shared.subscribe(
            channelKey: "notifications",
            table: "notifications",
            filter: "user_id=eq.\(userId)",
            accessToken: token
        ) {
            scheduleReload(token: token)
        }
    }

    private func scheduleReload(token: String) {
        reloadTask?.cancel()
        reloadTask = Task {
            try? await Task.sleep(nanoseconds: 400_000_000)
            guard !Task.isCancelled else { return }
            await viewModel.load(token: token, markRead: false)
        }
    }

    @ViewBuilder
    private func destination(for notification: AppNotification) -> some View {
        if let postId = notification.postId {
            PostThreadView(postId: postId)
        } else {
            ProfileView(username: notification.actor.username)
        }
    }
}