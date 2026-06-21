import SwiftUI

private struct GrokMessage: Identifiable {
    let id = UUID()
    let role: String
    let text: String
}

struct GrokView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var messages: [GrokMessage] = [
        GrokMessage(
            role: "assistant",
            text: "Olá! Sou o Grok do OffMe. Pergunte sobre o app ou qualquer assunto."
        ),
    ]
    @State private var input = ""
    @State private var sending = false
    @State private var error: String?

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        ForEach(messages) { message in
                            Text(message.text)
                                .font(.subheadline)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 10)
                                .background(
                                    message.role == "user"
                                        ? OffMeTheme.accent
                                        : OffMeTheme.surface
                                )
                                .foregroundStyle(message.role == "user" ? .white : OffMeTheme.text)
                                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                                .frame(
                                    maxWidth: .infinity,
                                    alignment: message.role == "user" ? .trailing : .leading
                                )
                                .id(message.id)
                        }

                        if sending {
                            Text("Pensando...")
                                .font(.subheadline)
                                .foregroundStyle(OffMeTheme.muted)
                                .padding(.horizontal, 14)
                        }

                        if let error {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(.red)
                                .frame(maxWidth: .infinity, alignment: .center)
                        }
                    }
                    .padding()
                }
                .onChange(of: messages.count) { _ in
                    if let last = messages.last {
                        withAnimation {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }

            Divider().overlay(OffMeTheme.border)

            HStack(spacing: 8) {
                TextField("Pergunte qualquer coisa...", text: $input, axis: .vertical)
                    .lineLimit(1...4)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(OffMeTheme.surface)
                    .clipShape(Capsule())

                Button("Enviar") {
                    Task { await sendMessage() }
                }
                .font(.subheadline.weight(.bold))
                .foregroundStyle(OffMeTheme.accent)
                .disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || sending)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(OffMeTheme.bg)
        }
        .background(OffMeTheme.bg)
        .navigationTitle("Grok")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func sendMessage() async {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !sending, let token = auth.accessToken else { return }

        messages.append(GrokMessage(role: "user", text: text))
        input = ""
        sending = true
        error = nil

        let history = messages
            .filter { $0.role == "user" || $0.role == "assistant" }
            .map { (role: $0.role, content: $0.text) }

        do {
            let reply = try await APIClient.shared.chatWithGrok(messages: history, token: token)
            messages.append(GrokMessage(role: "assistant", text: reply))
        } catch {
            self.error = error.localizedDescription
        }

        sending = false
    }
}