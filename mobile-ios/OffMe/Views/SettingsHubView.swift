import SwiftUI

struct SettingsHubView: View {
    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    var onVerification: () -> Void = {}
    var onLists: () -> Void = {}
    var onCommunities: () -> Void = {}

    @State private var showFeedback = false

    private let webSettingsURL = URL(string: "https://offme.vercel.app/settings")!
    private let webFeedbackURL = URL(string: "https://offme.vercel.app/settings/feedback")!

    var body: some View {
        NavigationStack {
            List {
                Section("Conta") {
                    settingsRow(icon: "checkmark.seal", title: "Verificação", action: onVerification)
                    settingsRow(icon: "list.bullet", title: "Listas", action: onLists)
                    settingsRow(icon: "person.2", title: "Comunidades", action: onCommunities)
                }

                Section("Preferências") {
                    Button {
                        openURL(webSettingsURL)
                    } label: {
                        Label("Configurações completas (web)", systemImage: "globe")
                    }
                    Button {
                        showFeedback = true
                    } label: {
                        Label("Feedback beta", systemImage: "bubble.left.and.text.bubble.right")
                    }
                }

                Section("Convidar") {
                    if let username = auth.session?.user.username {
                        let invite = "https://offme.vercel.app/signup?ref=\(username)"
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Link de convite")
                                .font(.subheadline.weight(.semibold))
                            Text(invite)
                                .font(.caption)
                                .foregroundStyle(OffMeTheme.muted)
                            ShareLink(item: invite) {
                                Text("Compartilhar convite")
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }

                Section {
                    Button(role: .destructive) {
                        auth.logout()
                        dismiss()
                    } label: {
                        Label("Sair", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .navigationTitle("Configurações")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Fechar") { dismiss() }
                }
            }
            .sheet(isPresented: $showFeedback) {
                FeedbackView()
                    .environmentObject(auth)
            }
        }
    }

    @ViewBuilder
    private func settingsRow(icon: String, title: String, action: @escaping () -> Void) -> some View {
        Button {
            dismiss()
            action()
        } label: {
            Label(title, systemImage: icon)
        }
    }
}