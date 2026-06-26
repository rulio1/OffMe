import SwiftUI

struct ListDetailView: View {
    let listId: Int
    @EnvironmentObject private var auth: AuthStore
    @State private var list: OffMeList?
    @State private var members: [User] = []
    @State private var isLoading = false
    @State private var error: String?
    @State private var showAddMember = false
    @State private var usernameToAdd = ""
    @State private var isAddingMember = false

    var body: some View {
        Group {
            if isLoading && list == nil {
                ProgressView("Carregando lista...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error = error, list == nil {
                errorView(error: error)
            } else if let list = list {
                mainContent(list: list)
            }
        }
        .background(OffMeTheme.bg)
        .navigationTitle(list?.name ?? "Lista")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadData()
        }
        .refreshable {
            await loadData()
        }
        .alert("Adicionar membro", isPresented: $showAddMember) {
            TextField("Nome de usuário", text: $usernameToAdd)
                .autocapitalization(.none)
                .disableAutocorrection(true)

            Button("Cancelar", role: .cancel) {
                usernameToAdd = ""
            }

            Button("Adicionar") {
                Task { await addMember() }
            }
            .disabled(usernameToAdd.isEmpty || isAddingMember)
        } message: {
            Text("Digite o nome de usuário para adicionar à lista")
        }
    }

    @ViewBuilder
    private func errorView(error: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "list.bullet.rectangle")
                .font(.largeTitle)
                .foregroundStyle(OffMeTheme.muted)
            Text("Não foi possível carregar a lista")
                .font(.headline)
            Text(error)
                .font(.subheadline)
                .foregroundStyle(OffMeTheme.muted)
            Button("Tentar novamente") {
                Task { await loadData() }
            }
            .buttonStyle(.bordered)
            .tint(OffMeTheme.accent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }

    @ViewBuilder
    private func mainContent(list: OffMeList) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Header
                VStack(alignment: .leading, spacing: 16) {
                    HStack(alignment: .top) {
                        if let bannerUrl = list.bannerUrl, !bannerUrl.isEmpty {
                            AsyncImage(url: URL(string: resolveImageURL(bannerUrl))) { phase in
                                if let image = phase.image {
                                    image.resizable()
                                        .scaledToFill()
                                        .frame(height: 100)
                                        .clipped()
                                } else {
                                    Rectangle()
                                        .fill(OffMeTheme.surface)
                                        .frame(height: 100)
                                }
                            }
                        } else {
                            Rectangle()
                                .fill(OffMeTheme.surface)
                                .frame(height: 100)
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(list.name)
                                .font(.title2.bold())

                            if list.isPrivate {
                                Image(systemName: "lock.fill")
                                    .foregroundStyle(OffMeTheme.muted)
                                    .font(.caption)
                            }
                        }

                        if let description = list.description, !description.isEmpty {
                            Text(description)
                                .font(.body)
                                .foregroundStyle(OffMeTheme.text)
                        }

                        HStack(spacing: 16) {
                            HStack(spacing: 4) {
                                Text("\(members.count)")
                                    .fontWeight(.bold)
                                Text("membros")
                            }

                            if list.isOwnedByCurrentUser {
                                Text("Sua lista")
                                    .font(.subheadline)
                                    .foregroundStyle(OffMeTheme.accent)
                            }
                        }
                        .font(.subheadline)
                        .foregroundStyle(OffMeTheme.muted)
                    }
                    .padding(.horizontal, 16)

                    if list.isOwnedByCurrentUser {
                        HStack(spacing: 8) {
                            Button(action: {
                                showAddMember = true
                            }) {
                                Image(systemName: "person.badge.plus")
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(.white)
                                    .padding(8)
                                    .background(
                                        Circle()
                                            .fill(OffMeTheme.accent)
                                    )
                            }

                            Spacer()

                            NavigationLink {
                                // Future: List settings view
                                Text("Configurações da lista")
                                    .navigationTitle("Configurações")
                            } label: {
                                Image(systemName: "gear")
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(OffMeTheme.text)
                                    .padding(8)
                                    .background(
                                        Circle()
                                            .fill(OffMeTheme.surface)
                                    )
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 8)
                    }
                }

                Divider()
                    .overlay(OffMeTheme.border)
                    .padding(.vertical, 8)

                // Members
                if members.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "person.2")
                            .font(.largeTitle)
                            .foregroundStyle(OffMeTheme.muted)

                        Text("Nenhum membro nesta lista ainda.")
                            .foregroundStyle(OffMeTheme.muted)

                        if list.isOwnedByCurrentUser {
                            Text("Toque em + para adicionar membros.")
                                .font(.subheadline)
                                .foregroundStyle(OffMeTheme.muted)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 32)
                } else {
                    LazyVStack(spacing: 0) {
                        ForEach(members) { member in
                            memberRow(member: member, list: list)
                            Divider().overlay(OffMeTheme.border)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func memberRow(member: User, list: OffMeList) -> some View {
        HStack(spacing: 12) {
            UserAvatarView(url: member.avatarUrl, size: 48)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 4) {
                    Text(member.displayName)
                        .font(.subheadline.weight(.bold))

                    if member.verified {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundStyle(OffMeTheme.accent)
                            .font(.caption)
                    }
                }

                Text("@\(member.username)")
                    .font(.caption)
                    .foregroundStyle(OffMeTheme.muted)

                if let bio = member.bio, !bio.isEmpty {
                    Text(bio)
                        .font(.caption)
                        .foregroundStyle(OffMeTheme.text)
                        .lineLimit(2)
                }
            }

            Spacer()

            if list.isOwnedByCurrentUser {
                Button(action: {
                    // Future: Remove member functionality
                }) {
                    Image(systemName: "minus.circle.fill")
                        .foregroundStyle(OffMeTheme.muted)
                        .font(.title3)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(12)
        .contentShape(Rectangle())
        .onTapGesture {
            // Navigate to user profile
        }
    }

    private func resolveImageURL(_ url: String) -> String {
        if url.hasPrefix("http://") || url.hasPrefix("https://") {
            return url
        }
        return "https://offme.vercel.app" + (url.hasPrefix("/") ? url : "/\(url)")
    }

    private func loadData() async {
        guard let token = auth.accessToken else {
            error = "Usuário não autenticado"
            return
        }

        isLoading = true
        error = nil

        do {
            async let listData = APIClient.shared.fetchListDetail(listId: listId, token: token)
            async let membersData = APIClient.shared.fetchListMembers(listId: listId, token: token)

            let (listResponse, membersResponse) = try await (listData, membersData)
            list = listResponse
            members = membersResponse.members
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    private func addMember() async {
        guard let token = auth.accessToken, !usernameToAdd.isEmpty else { return }

        isAddingMember = true
        error = nil

        do {
            let updatedList = try await APIClient.shared.addMemberToList(
                listId: listId,
                username: usernameToAdd,
                token: token
            )
            list = updatedList
            usernameToAdd = ""

            // Refresh members list
            let membersResponse = try await APIClient.shared.fetchListMembers(listId: listId, token: token)
            members = membersResponse.members
        } catch {
            self.error = error.localizedDescription
        }

        isAddingMember = false
    }
}

// MARK: - API Extensions

extension APIClient {
    func fetchListDetail(listId: Int, token: String) async throws -> OffMeList {
        struct Response: Decodable {
            let list: OffMeList
        }

        let response: Response = try await request("/lists/\(listId)", token: token)
        return response.list
    }

    func fetchListMembers(listId: Int, token: String) async throws -> ListMembersResponse {
        struct ListMembersResponse: Decodable {
            let members: [User]
        }

        let response: ListMembersResponse = try await request("/lists/\(listId)/members", token: token)
        return response
    }

    func addMemberToList(listId: Int, username: String, token: String) async throws -> OffMeList {
        struct RequestBody: Encodable {
            let username: String
        }

        struct Response: Decodable {
            let list: OffMeList
        }

        let body = RequestBody(username: username)
        let response: Response = try await request("/lists/\(listId)/members", method: "POST", body: body, token: token)
        return response.list
    }
}