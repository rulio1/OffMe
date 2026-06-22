import SwiftUI

struct ListsView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var lists: [OffMeList] = []
    @State private var name = ""
    @State private var isLoading = true
    @State private var error: String?

    var body: some View {
        List {
            Section("Nova lista") {
                TextField("Nome da lista", text: $name)
                Button("Criar lista") {
                    Task { await create() }
                }
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            }

            if isLoading {
                Text("Carregando...")
            } else if lists.isEmpty {
                Text("Nenhuma lista ainda.")
            } else {
                ForEach(lists) { list in
                    VStack(alignment: .leading) {
                        Text(list.name).font(.headline)
                        Text("\(list.memberCount) membros")
                            .font(.subheadline)
                            .foregroundStyle(OffMeTheme.muted)
                    }
                }
            }
        }
        .navigationTitle("Listas")
        .task { await load() }
    }

    private func load() async {
        guard let token = auth.accessToken else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            lists = try await APIClient.shared.fetchLists(token: token)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func create() async {
        guard let token = auth.accessToken else { return }
        do {
            _ = try await APIClient.shared.createList(name: name.trimmingCharacters(in: .whitespaces), token: token)
            name = ""
            await load()
        } catch {
            self.error = error.localizedDescription
        }
    }
}