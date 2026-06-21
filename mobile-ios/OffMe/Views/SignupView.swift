import SwiftUI

struct SignupView: View {
    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss

    @State private var displayName = ""
    @State private var username = ""
    @State private var email = ""
    @State private var password = ""
    @State private var error: String?

    var body: some View {
        AuthScreenLayout {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Text("Criar conta")
                        .font(.title.bold())
                        .foregroundStyle(OffMeTheme.text)
                    Text("Preencha os dados para começar")
                        .font(.subheadline)
                        .foregroundStyle(OffMeTheme.muted)
                }

                VStack(spacing: 12) {
                    TextField("Nome de exibição", text: $displayName)
                        .liquidGlassField()
                    TextField("Usuário", text: $username)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .liquidGlassField()
                    TextField("E-mail", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .liquidGlassField()
                    SecureField("Senha", text: $password)
                        .liquidGlassField()
                }

                if let error {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }

                Button {
                    Task { await submit() }
                } label: {
                    Group {
                        if auth.isLoading {
                            ProgressView().tint(.white)
                        } else {
                            Text("Cadastrar")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .liquidGlassCapsuleButton()
                }
                .disabled(auth.isLoading)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    private func submit() async {
        error = nil

        let trimmedName = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedUsername = username.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedEmail = normalizeEmail(email)

        if let validationError = validateSignup(
            displayName: trimmedName,
            username: trimmedUsername,
            email: normalizedEmail,
            password: password
        ) {
            error = validationError
            return
        }

        do {
            try await auth.register(
                username: trimmedUsername,
                email: normalizedEmail,
                password: password,
                displayName: trimmedName
            )
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func normalizeEmail(_ value: String) -> String {
        value
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
            .replacingOccurrences(of: " ", with: "")
    }

    private func validateSignup(
        displayName: String,
        username: String,
        email: String,
        password: String
    ) -> String? {
        if displayName.isEmpty {
            return "Informe seu nome de exibição"
        }
        if displayName.count > 50 {
            return "Nome de exibição muito longo"
        }

        let usernamePattern = #"^[a-zA-Z0-9_]{1,15}$"#
        if username.range(of: usernamePattern, options: .regularExpression) == nil {
            return "Usuário: 1–15 caracteres (letras, números e _)"
        }

        if email.isEmpty {
            return "Informe seu e-mail"
        }
        if !email.contains("@") {
            return "O e-mail precisa conter @ (ex: nome@outlook.de)"
        }

        let emailPattern = #"^[^\s@]+@[^\s@]+\.[^\s@]+$"#
        if email.range(of: emailPattern, options: .regularExpression) == nil {
            return "Informe um e-mail válido (ex: nome@outlook.de)"
        }

        if password.count < 8 {
            return "A senha deve ter pelo menos 8 caracteres"
        }

        return nil
    }
}