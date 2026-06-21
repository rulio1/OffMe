import SwiftUI

@MainActor
final class ConversationThreadViewModel: ObservableObject {
    @Published var messages: [DirectMessage] = []
    @Published var isLoading = false
    @Published var error: String?

    func load(conversationId: Int, token: String) async {
        isLoading = messages.isEmpty
        error = nil
        defer { isLoading = false }

        do {
            messages = try await APIClient.shared.fetchMessages(conversationId: conversationId, token: token)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func send(conversationId: Int, text: String, token: String) async throws {
        let message = try await APIClient.shared.sendDirectMessage(
            conversationId: conversationId,
            text: text,
            token: token
        )
        messages.append(message)
    }
}

struct ConversationThreadView: View {
    let conversationId: Int

    @EnvironmentObject private var auth: AuthStore
    @StateObject private var viewModel = ConversationThreadViewModel()
    @State private var draft = ""
    @State private var sending = false

    var body: some View {
        VStack(spacing: 0) {
            if viewModel.isLoading && viewModel.messages.isEmpty {
                ProgressView("Carregando...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 8) {
                            ForEach(viewModel.messages) { message in
                                MessageBubble(message: message)
                                    .id(message.id)
                            }
                        }
                        .padding()
                    }
                    .onChange(of: viewModel.messages.count) { _ in
                        if let last = viewModel.messages.last {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }

            HStack(spacing: 8) {
                TextField("Mensagem...", text: $draft, axis: .vertical)
                    .lineLimit(1...4)
                    .textFieldStyle(.roundedBorder)

                Button(sending ? "..." : "Enviar") {
                    Task { await sendMessage() }
                }
                .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || sending)
            }
            .padding()
            .liquidGlassCard(cornerRadius: 0, contentPadding: 12)
        }
        .offMeScreenBackground()
        .navigationTitle("Conversa")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if let token = auth.accessToken {
                await viewModel.load(conversationId: conversationId, token: token)
            }
        }
        .refreshable {
            if let token = auth.accessToken {
                await viewModel.load(conversationId: conversationId, token: token)
            }
        }
    }

    private func sendMessage() async {
        guard let token = auth.accessToken else { return }
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !sending else { return }

        sending = true
        draft = ""
        defer { sending = false }

        do {
            try await viewModel.send(conversationId: conversationId, text: text, token: token)
        } catch {
            draft = text
        }
    }
}

private struct MessageBubble: View {
    let message: DirectMessage

    var body: some View {
        HStack {
            if message.isMine == true { Spacer(minLength: 48) }
            Text(message.text)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background {
                    if message.isMine == true {
                        Capsule(style: .continuous)
                            .fill(OffMeTheme.accent)
                            .overlay(Capsule(style: .continuous).strokeBorder(.white.opacity(0.2), lineWidth: 0.5))
                    } else {
                        LiquidGlassSurface(cornerRadius: 18, tint: Color.black.opacity(0.06))
                    }
                }
                .foregroundStyle(message.isMine == true ? .white : OffMeTheme.text)
            if message.isMine != true { Spacer(minLength: 48) }
        }
    }
}