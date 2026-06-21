import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var email = ""
    @State private var password = ""
    @State private var error: String?
    @State private var showSignup = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    OffMeLogoView(size: 42)
                    Text("Bem-vindo de volta")
                        .foregroundStyle(OffMeTheme.muted)
                }
                .padding(.top, 40)

                VStack(spacing: 14) {
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
                            Text("Entrar")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .liquidGlassCapsuleButton()
                }
                .disabled(auth.isLoading)

                Button("Criar conta") { showSignup = true }
                    .foregroundStyle(OffMeTheme.accent)

                Text("API: \(APIConfig.baseURL)")
                    .font(.caption2)
                    .foregroundStyle(OffMeTheme.muted)
                    .padding(.top, 8)

                Spacer()
            }
            .padding(24)
            .offMeScreenBackground()
            .navigationDestination(isPresented: $showSignup) {
                SignupView()
            }
        }
    }

    private func submit() async {
        error = nil
        do {
            try await auth.login(email: email.trimmingCharacters(in: .whitespaces), password: password)
        } catch {
            self.error = error.localizedDescription
        }
    }
}