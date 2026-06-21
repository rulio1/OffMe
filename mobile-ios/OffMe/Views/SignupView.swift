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
        VStack(spacing: 16) {
            Text("Criar conta")
                .font(.title.bold())
                .foregroundStyle(OffMeTheme.text)

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

            Spacer()
        }
        .padding(24)
        .offMeScreenBackground()
        .navigationBarTitleDisplayMode(.inline)
    }

    private func submit() async {
        error = nil
        do {
            try await auth.register(
                username: username.lowercased().trimmingCharacters(in: .whitespaces),
                email: email.trimmingCharacters(in: .whitespaces).lowercased(),
                password: password,
                displayName: displayName.trimmingCharacters(in: .whitespaces)
            )
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }
}