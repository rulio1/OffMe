import SwiftUI

@MainActor
final class ExploreViewModel: ObservableObject {
    @Published var query = ""
    @Published var users: [User] = []
    @Published var isLoading = false

    private var searchTask: Task<Void, Never>?

    func search(token: String) {
        searchTask?.cancel()
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            users = []
            return
        }

        searchTask = Task {
            try? await Task.sleep(nanoseconds: 300_000_000)
            guard !Task.isCancelled else { return }
            isLoading = true
            defer { isLoading = false }
            do {
                users = try await APIClient.shared.searchUsers(query: trimmed, token: token)
            } catch {
                users = []
            }
        }
    }
}

struct ExploreView: View {
    @EnvironmentObject private var auth: AuthStore
    @StateObject private var viewModel = ExploreViewModel()

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(OffMeTheme.muted)
                TextField("Buscar usuários", text: $viewModel.query)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .onChange(of: viewModel.query) { _ in
                        if let token = auth.accessToken {
                            viewModel.search(token: token)
                        }
                    }
            }
            .padding(12)
            .background(OffMeTheme.surface)
            .clipShape(Capsule())
            .padding()

            if viewModel.query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "person.2")
                        .font(.largeTitle)
                        .foregroundStyle(OffMeTheme.muted)
                    Text("Digite um nome ou @usuário")
                        .foregroundStyle(OffMeTheme.muted)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.isLoading {
                ProgressView("Buscando...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.users.isEmpty {
                Text("Nenhum usuário encontrado.")
                    .foregroundStyle(OffMeTheme.muted)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List(viewModel.users) { user in
                    HStack(spacing: 12) {
                        NavigationLink(value: user.username) {
                            HStack(spacing: 12) {
                                Circle()
                                    .fill(OffMeTheme.surface)
                                    .frame(width: 44, height: 44)

                                VStack(alignment: .leading, spacing: 2) {
                                    HStack(spacing: 4) {
                                        Text(user.displayName)
                                            .fontWeight(.semibold)
                                        if user.verified {
                                            Image(systemName: "checkmark.seal.fill")
                                                .foregroundStyle(OffMeTheme.accent)
                                                .font(.caption)
                                        }
                                    }
                                    Text("@\(user.username)")
                                        .font(.subheadline)
                                        .foregroundStyle(OffMeTheme.muted)
                                    if let bio = user.bio, !bio.isEmpty {
                                        Text(bio)
                                            .font(.caption)
                                            .foregroundStyle(OffMeTheme.muted)
                                            .lineLimit(1)
                                    }
                                }
                            }
                        }
                        .buttonStyle(.plain)

                        FollowButton(
                            username: user.username,
                            isFollowing: bindingForFollow(user)
                        )
                    }
                    .listRowBackground(OffMeTheme.bg)
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .background(OffMeTheme.bg)
        .navigationTitle("Explorar")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: String.self) { username in
            ProfileView(username: username)
        }
        .navigationDestination(for: Int.self) { postId in
            PostThreadView(postId: postId)
        }
    }

    private func bindingForFollow(_ user: User) -> Binding<Bool> {
        Binding(
            get: {
                viewModel.users.first(where: { $0.id == user.id })?.isFollowing ?? false
            },
            set: { newValue in
                if let index = viewModel.users.firstIndex(where: { $0.id == user.id }) {
                    viewModel.users[index] = viewModel.users[index].with(isFollowing: newValue)
                }
            }
        )
    }
}