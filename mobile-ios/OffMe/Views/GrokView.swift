import SwiftUI

struct GrokMessage: Identifiable {
    let id = UUID()
    let role: Role
    let text: String
    let isDemo: Bool

    enum Role { case user, assistant }
}

@MainActor
final class GrokViewModel: ObservableObject {
    @Published var messages: [GrokMessage] = []
    @Published var inputText: String = ""
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    private let api = APIClient.shared

    func send(token: String, username: String) async {
        let trimmed = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isLoading else { return }

        // Mensagem de boas-vindas automática se for a primeira
        if messages.isEmpty {
            messages.append(GrokMessage(
                role: .assistant,
                text: "Olá, @\(username)! 👋 Sou o assistente do OffMe. Como posso ajudar?",
                isDemo: false
            ))
        }

        let userMsg = GrokMessage(role: .user, text: trimmed, isDemo: false)
        messages.append(userMsg)
        inputText = ""
        isLoading = true
        errorMessage = nil

        // Envia histórico (últimas 20 mensagens) para a API
        let history: [GrokChatMessage] = messages.suffix(20).map { msg in
            GrokChatMessage(
                role: msg.role == .user ? "user" : "assistant",
                content: msg.text
            )
        }

        do {
            let res = try await api.grokChat(messages: history, token: token)
            messages.append(GrokMessage(
                role: .assistant,
                text: res.reply,
                isDemo: res.demo ?? false
            ))
        } catch APIError.unauthorized {
            errorMessage = "Sessão expirada. Faça login novamente."
        } catch {
            errorMessage = error.localizedDescription
            // Remove a mensagem do usuário para que ele possa reenviar
            if let idx = messages.firstIndex(where: { $0.id == userMsg.id }) {
                messages.remove(at: idx)
                inputText = trimmed
            }
        }

        isLoading = false
    }

    func clear() {
        messages.removeAll()
        errorMessage = nil
    }
}

struct GrokView: View {
    @EnvironmentObject private var auth: AuthStore
    @StateObject private var viewModel = GrokViewModel()

    var body: some View {
        VStack(spacing: 0) {
            // Demo badge
            if let last = viewModel.messages.last, last.isDemo {
                DemoBadge()
                    .padding(.horizontal)
                    .padding(.top, 6)
            }

            // Messages
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        if viewModel.messages.isEmpty {
                            emptyState
                                .padding(.top, 80)
                        }

                        ForEach(viewModel.messages) { msg in
                            MessageBubble(message: msg)
                                .id(msg.id)
                        }

                        if viewModel.isLoading {
                            TypingIndicator()
                                .id("typing")
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 16)
                }
                .onChange(of: viewModel.messages.count) { _ in
                    withAnimation(.easeOut(duration: 0.2)) {
                        if let lastId = viewModel.messages.last?.id {
                            proxy.scrollTo(lastId, anchor: .bottom)
                        }
                    }
                }
                .onChange(of: viewModel.isLoading) { loading in
                    if loading {
                        withAnimation { proxy.scrollTo("typing", anchor: .bottom) }
                    }
                }
            }

            // Error
            if let err = viewModel.errorMessage {
                Text(err)
                    .font(.caption)
                    .foregroundStyle(OffMeTheme.like)
                    .padding(.horizontal)
                    .padding(.bottom, 4)
            }

            // Input bar
            inputBar
        }
        .background(OffMeTheme.bg)
        .navigationTitle("Grok")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                if !viewModel.messages.isEmpty {
                    Button {
                        viewModel.clear()
                    } label: {
                        Image(systemName: "trash")
                            .font(.system(size: 15))
                            .foregroundStyle(OffMeTheme.muted)
                    }
                }
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "sparkles")
                .font(.system(size: 44))
                .foregroundStyle(OffMeTheme.accent)

            Text("Assistente Grok")
                .font(.title2.bold())

            Text("Pergunte qualquer coisa sobre o OffMe ou qualquer outro assunto.")
                .font(.subheadline)
                .foregroundStyle(OffMeTheme.muted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
    }

    // MARK: - Input Bar

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("Pergunte algo...", text: $viewModel.inputText, axis: .vertical)
                .lineLimit(1...4)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(OffMeTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(OffMeTheme.border, lineWidth: 1)
                )

            Button {
                if let token = auth.accessToken {
                    Task {
                        await viewModel.send(
                            token: token,
                            username: auth.session?.user.username ?? "você"
                        )
                    }
                }
            } label: {
                Image(systemName: viewModel.isLoading ? "stop.fill" : "arrow.up")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(
                        viewModel.inputText.trimmingCharacters(in: .whitespaces).isEmpty || viewModel.isLoading
                            ? OffMeTheme.muted.opacity(0.5)
                            : OffMeTheme.accent
                    )
                    .clipShape(Circle())
            }
            .disabled(viewModel.inputText.trimmingCharacters(in: .whitespaces).isEmpty || viewModel.isLoading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
        .background(OffMeTheme.bg.opacity(0.92))
    }
}

// MARK: - Message Bubble

private struct MessageBubble: View {
    let message: GrokMessage

    var body: some View {
        HStack {
            if message.role == .user { Spacer(minLength: 40) }

            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 4) {
                Text(message.text)
                    .font(.body)
                    .foregroundStyle(message.role == .user ? .white : OffMeTheme.text)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        message.role == .user
                            ? OffMeTheme.accent
                            : OffMeTheme.surface
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(
                                message.role == .user ? Color.clear : OffMeTheme.border,
                                lineWidth: 1
                            )
                    )
            }

            if message.role == .assistant { Spacer(minLength: 40) }
        }
    }
}

// MARK: - Typing Indicator

private struct TypingIndicator: View {
    @State private var animate = false

    var body: some View {
        HStack {
            HStack(spacing: 5) {
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(OffMeTheme.muted)
                        .frame(width: 7, height: 7)
                        .scaleEffect(animate ? 1.3 : 0.7)
                        .animation(
                            .easeInOut(duration: 0.5)
                                .repeatForever()
                                .delay(Double(i) * 0.15),
                            value: animate
                        )
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(OffMeTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(OffMeTheme.border, lineWidth: 1)
            )

            Spacer()
        }
        .onAppear { animate = true }
    }
}

// MARK: - Demo Badge

private struct DemoBadge: View {
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "info.circle.fill")
                .font(.system(size: 12))
            Text("Modo demo — configure GROK_API_KEY no servidor para IA real")
                .font(.caption2)
        }
        .foregroundStyle(OffMeTheme.muted)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(OffMeTheme.surface)
        .clipShape(Capsule())
        .overlay(Capsule().stroke(OffMeTheme.border, lineWidth: 1))
        .frame(maxWidth: .infinity, alignment: .center)
    }
}