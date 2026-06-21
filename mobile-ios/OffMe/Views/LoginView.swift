import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var identifier = ""
    @State private var password = ""
    @State private var error: String?
    @State private var showSignup = false

    var body: some View {
        NavigationStack {
            AuthScreenLayout {
                VStack(spacing: 28) {
                    VStack(spacing: 10) {
                        OffMeLogoView(size: 48)
                        Text("Bem-vindo de volta")
                            .font(.title3)
                            .foregroundStyle(OffMeTheme.muted)
                    }

                    VStack(spacing: 14) {
                        TextField("E-mail ou usuário", text: $identifier)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.default)
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

                    VStack(spacing: 16) {
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
                    }
                }
            }
            .navigationDestination(isPresented: $showSignup) {
                SignupView()
            }
        }
    }

    private func submit() async {
        error = nil
        do {
            try await auth.login(identifier: identifier, password: password)
        } catch {
            self.error = error.localizedDescription
        }
    }
}