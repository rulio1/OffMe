import SwiftUI

struct CommunitiesView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var communities: [OffMeCommunity] = []
    @State private var name = ""
    @State private var isLoading = true
    @State private var error: String?

    var body: some View {
        List {
            Section("Nova comunidade") {
                TextField("Nome da comunidade", text: $name)
                Button("Criar comunidade") {
                    Task { await create() }
                }
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            }

            if isLoading {
                Text("Carregando...")
            } else if communities.isEmpty {
                Text("Nenhuma comunidade ainda.")
            } else {
                ForEach(communities) { community in
                    VStack(alignment: .leading) {
                        Text(community.name).font(.headline)
                        Text("@\(community.slug) · \(community.memberCount) membros")
                            .font(.subheadline)
                            .foregroundStyle(OffMeTheme.muted)
                    }
                }
            }
        }
        .navigationTitle("Comunidades")
        .task { await load() }
    }

    private func load() async {
        guard let token = auth.accessToken else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            communities = try await APIClient.shared.fetchCommunities(token: token)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func create() async {
        guard let token = auth.accessToken else { return }
        do {
            _ = try await APIClient.shared.createCommunity(name: name.trimmingCharacters(in: .whitespaces), token: token)
            name = ""
            await load()
        } catch {
            self.error = error.localizedDescription
        }
    }
}