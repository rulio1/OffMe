import SwiftUI

struct FeedbackView: View {
    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss

    @State private var category: FeedbackCategory = .general
    @State private var message: String = ""
    @State private var submitting = false
    @State private var error: String?
    @State private var success = false

    private var canSubmit: Bool {
        !submitting && !success && message.trimmingCharacters(in: .whitespacesAndNewlines).count >= 5
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("Estamos em beta aberto e cada mensagem conta. Bugs, ideias e impressões gerais são bem-vindos — lemos tudo.")
                        .font(.footnote)
                        .foregroundStyle(OffMeTheme.muted)
                }

                Section("Categoria") {
                    ForEach(FeedbackCategory.allCases) { item in
                        Button {
                            category = item
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.title)
                                        .foregroundStyle(OffMeTheme.text)
                                    Text(item.hint)
                                        .font(.caption)
                                        .foregroundStyle(OffMeTheme.muted)
                                }
                                Spacer()
                                if category == item {
                                    Image(systemName: "checkmark")
                                        .foregroundStyle(OffMeTheme.accent)
                                }
                            }
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }

                Section("Mensagem") {
                    TextEditor(text: $message)
                        .frame(minHeight: 120)
                        .disabled(success)
                    HStack {
                        Text("\(message.count)/2000 · mínimo 5 caracteres")
                        Spacer()
                    }
                    .font(.caption2)
                    .foregroundStyle(OffMeTheme.muted)
                }

                if let error {
                    Section {
                        Text(error)
                            .foregroundStyle(.red)
                            .font(.footnote)
                    }
                }

                if success {
                    Section {
                        Label("Obrigado! Seu feedback foi recebido.", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                    }
                }

                Section {
                    Button {
                        Task { await submit() }
                    } label: {
                        HStack {
                            if submitting { ProgressView() }
                            Text(submitting ? "Enviando..." : "Enviar feedback")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .disabled(!canSubmit)
                }
            }
            .navigationTitle("Feedback beta")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Fechar") { dismiss() }
                }
            }
        }
    }

    private func submit() async {
        error = nil
        submitting = true
        defer { submitting = false }
        guard let token = auth.accessToken else {
            error = "Não autenticado"
            return
        }
        do {
            try await APIClient.shared.submitFeedback(
                category: category.rawValue,
                message: message.trimmingCharacters(in: .whitespacesAndNewlines),
                pageUrl: nil,
                token: token
            )
            success = true
            message = ""
        } catch {
            self.error = error.localizedDescription
        }
    }
}

enum FeedbackCategory: String, CaseIterable, Identifiable {
    case bug, idea, general

    var id: String { rawValue }

    var title: String {
        switch self {
        case .bug: return "Bug"
        case .idea: return "Ideia"
        case .general: return "Geral"
        }
    }

    var hint: String {
        switch self {
        case .bug: return "Algo quebrou ou não funciona como esperado"
        case .idea: return "Sugestão de melhoria ou nova funcionalidade"
        case .general: return "Comentário, elogio ou outra observação"
        }
    }
}