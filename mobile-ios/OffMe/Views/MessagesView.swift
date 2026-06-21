import SwiftUI

@MainActor
final class MessagesViewModel: ObservableObject {
    @Published var conversations: [ConversationSummary] = []
    @Published var isLoading = false
    @Published var error: String?

    func load(token: String) async {
        isLoading = conversations.isEmpty
        error = nil
        defer { isLoading = false }

        do {
            conversations = try await APIClient.shared.fetchConversations(token: token)
        } catch {
            self.error = error.localizedDescription
        }
    }
}

struct MessagesView: View {
    @EnvironmentObject private var auth: AuthStore
    @StateObject private var viewModel = MessagesViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.conversations.isEmpty {
                ProgressView("Carregando...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error = viewModel.error, viewModel.conversations.isEmpty {
                Text(error)
                    .foregroundStyle(.red)
                    .padding()
            } else if viewModel.conversations.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "envelope")
                        .font(.largeTitle)
                        .foregroundStyle(OffMeTheme.muted)
                    Text("Nenhuma conversa")
                        .font(.headline)
                    Text("Visite um perfil e toque em Mensagem.")
                        .font(.subheadline)
                        .foregroundStyle(OffMeTheme.muted)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding()
            } else {
                List(viewModel.conversations) { conversation in
                    NavigationLink(value: conversation.id) {
                        ConversationRow(conversation: conversation)
                    }
                    .listRowBackground(OffMeTheme.bg)
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .background(OffMeTheme.bg)
        .navigationTitle("Mensagens")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Int.self) { conversationId in
            ConversationThreadView(conversationId: conversationId)
        }
        .refreshable {
            if let token = auth.accessToken {
                await viewModel.load(token: token)
            }
        }
        .task {
            if let token = auth.accessToken {
                await viewModel.load(token: token)
                subscribeRealtime(token: token)
            }
        }
        .onDisappear {
            SupabaseRealtimeClient.shared.unsubscribe(channelKey: "messages")
        }
    }

    private func subscribeRealtime(token: String) {
        guard SupabaseConfig.isConfigured else { return }
        SupabaseRealtimeClient.shared.subscribe(
            channelKey: "messages",
            table: "direct_messages",
            filter: "",
            accessToken: token
        ) {
            Task {
                await viewModel.load(token: token)
            }
        }
    }
}

private struct ConversationRow: View {
    let conversation: ConversationSummary

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(OffMeTheme.surface)
                .frame(width: 44, height: 44)
                .overlay {
                    if let urlString = conversation.participant.avatarUrl,
                       let url = URL(string: urlString) {
                        AsyncImage(url: url) { phase in
                            if case .success(let image) = phase {
                                image.resizable().scaledToFill()
                            }
                        }
                        .clipShape(Circle())
                    }
                }

            VStack(alignment: .leading, spacing: 2) {
                Text(conversation.participant.displayName)
                    .fontWeight(.semibold)
                    .foregroundStyle(OffMeTheme.text)
                Text("@\(conversation.participant.username)")
                    .font(.caption)
                    .foregroundStyle(OffMeTheme.muted)
                if let last = conversation.lastMessage {
                    Text(last.text)
                        .font(.subheadline)
                        .foregroundStyle(OffMeTheme.muted)
                        .lineLimit(1)
                }
            }
        }
        .padding(.vertical, 4)
    }
}