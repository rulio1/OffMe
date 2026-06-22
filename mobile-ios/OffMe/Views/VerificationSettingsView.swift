import SwiftUI

struct VerificationSettingsView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var reason = ""
    @State private var status: String?
    @State private var isVerified = false
    @State private var isLoading = true
    @State private var isSubmitting = false
    @State private var error: String?
    @State private var success: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if isLoading {
                    ProgressView("Carregando...")
                } else {
                    Text(isVerified
                         ? "Sua conta já está verificada."
                         : "Solicite o selo de verificação para sua conta.")
                        .foregroundStyle(OffMeTheme.muted)

                    if let status {
                        Text("Última solicitação: \(statusLabel(status))")
                            .font(.subheadline)
                    }

                    if !isVerified && status != "pending" {
                        Text("Por que você deve ser verificado?")
                            .font(.headline)
                        TextEditor(text: $reason)
                            .frame(minHeight: 120)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(OffMeTheme.border))

                        if let error {
                            Text(error).foregroundStyle(.red)
                        }
                        if let success {
                            Text(success).foregroundStyle(OffMeTheme.accent)
                        }

                        Button(isSubmitting ? "Enviando..." : "Enviar solicitação") {
                            Task { await submit() }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(isSubmitting || reason.trimmingCharacters(in: .whitespacesAndNewlines).count < 10)
                    } else if !isVerified && status == "pending" {
                        Text("Sua solicitação está em análise.")
                            .foregroundStyle(OffMeTheme.muted)
                    }
                }
            }
            .padding()
        }
        .background(OffMeTheme.bg)
        .navigationTitle("Verificação")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private func statusLabel(_ value: String) -> String {
        switch value {
        case "pending": return "Pendente"
        case "approved": return "Aprovada"
        case "rejected": return "Rejeitada"
        default: return value
        }
    }

    private func load() async {
        guard let token = auth.accessToken else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let res = try await APIClient.shared.fetchVerificationStatus(token: token)
            status = res.request?.status
            isVerified = res.verified ?? auth.session?.user.verified ?? false
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func submit() async {
        guard let token = auth.accessToken else { return }
        isSubmitting = true
        error = nil
        success = nil
        defer { isSubmitting = false }
        do {
            try await APIClient.shared.submitVerificationRequest(
                reason: reason.trimmingCharacters(in: .whitespacesAndNewlines),
                token: token
            )
            success = "Solicitação enviada com sucesso."
            status = "pending"
            reason = ""
        } catch {
            self.error = error.localizedDescription
        }
    }
}