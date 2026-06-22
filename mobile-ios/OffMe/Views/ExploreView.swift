import SwiftUI

enum ExploreSearchTab: String, CaseIterable {
    case top = "Top"
    case people = "Pessoas"
}

@MainActor
final class ExploreViewModel: ObservableObject {
    @Published var query = ""
    @Published var debouncedQuery = ""
    @Published var tab: ExploreSearchTab = .top
    @Published var users: [User] = []
    @Published var posts: [Post] = []
    @Published var trending: [Post] = []
    @Published var isSearching = false
    @Published var isLoadingTrending = false

    private var debounceTask: Task<Void, Never>?
    private var searchTask: Task<Void, Never>?

    func onQueryChange(_ newValue: String) {
        debounceTask?.cancel()
        debounceTask = Task {
            try? await Task.sleep(nanoseconds: 300_000_000)
            guard !Task.isCancelled else { return }
            debouncedQuery = newValue.trimmingCharacters(in: .whitespacesAndNewlines)
        }
    }

    func loadTrending(token: String) async {
        isLoadingTrending = trending.isEmpty
        defer { isLoadingTrending = false }

        do {
            trending = try await APIClient.shared.fetchTrendingPosts(token: token)
        } catch {
            trending = []
        }
    }

    func search(token: String) {
        searchTask?.cancel()
        guard !debouncedQuery.isEmpty else {
            users = []
            posts = []
            isSearching = false
            return
        }

        searchTask = Task {
            isSearching = true
            defer { isSearching = false }

            do {
                switch tab {
                case .top:
                    posts = try await APIClient.shared.searchPosts(query: debouncedQuery, token: token)
                    users = []
                case .people:
                    users = try await APIClient.shared.searchUsers(query: debouncedQuery, token: token)
                    posts = []
                }
            } catch {
                users = []
                posts = []
            }
        }
    }
}

struct ExploreView: View {
    @EnvironmentObject private var auth: AuthStore
    @StateObject private var viewModel = ExploreViewModel()

    private var hasQuery: Bool {
        !viewModel.debouncedQuery.isEmpty
    }

    var body: some View {
        VStack(spacing: 0) {
            searchBar

            if hasQuery {
                searchTabs
            }

            content
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
        .task {
            if let token = auth.accessToken {
                await viewModel.loadTrending(token: token)
            }
        }
        .onChange(of: viewModel.query) { newValue in
            viewModel.onQueryChange(newValue)
        }
        .onChange(of: viewModel.debouncedQuery) { _ in
            if let token = auth.accessToken {
                viewModel.search(token: token)
            }
        }
        .onChange(of: viewModel.tab) { _ in
            if let token = auth.accessToken, hasQuery {
                viewModel.search(token: token)
            }
        }
    }

    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(OffMeTheme.muted)
            TextField("Buscar posts e pessoas", text: $viewModel.query)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
        }
        .padding(12)
        .background(OffMeTheme.surface)
        .clipShape(Capsule())
        .padding()
    }

    private var searchTabs: some View {
        HStack(spacing: 24) {
            ForEach(ExploreSearchTab.allCases, id: \.self) { item in
                Button {
                    viewModel.tab = item
                } label: {
                    VStack(spacing: 0) {
                        Text(item.rawValue)
                            .font(.system(size: 15, weight: viewModel.tab == item ? .bold : .medium))
                            .foregroundStyle(viewModel.tab == item ? OffMeTheme.text : OffMeTheme.muted)
                            .frame(height: 44)

                        if viewModel.tab == item {
                            Capsule()
                                .fill(OffMeTheme.accent)
                                .frame(width: 48, height: 4)
                        } else {
                            Color.clear.frame(height: 4)
                        }
                    }
                }
                .buttonStyle(.plain)
            }
            Spacer()
        }
        .padding(.horizontal, 16)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(OffMeTheme.border)
                .frame(height: 0.5)
        }
    }

    @ViewBuilder
    private var content: some View {
        if !hasQuery {
            trendingContent
        } else if viewModel.isSearching {
            ProgressView("Buscando...")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if viewModel.tab == .people {
            usersContent
        } else {
            postsContent
        }
    }

    @ViewBuilder
    private var trendingContent: some View {
        if viewModel.isLoadingTrending && viewModel.trending.isEmpty {
            ProgressView("Carregando...")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 0) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Em alta")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(OffMeTheme.text)
                        Text("Posts com mais engajamento")
                            .font(.subheadline)
                            .foregroundStyle(OffMeTheme.muted)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)

                    if viewModel.trending.isEmpty {
                        Text("Nenhum post em destaque ainda.")
                            .foregroundStyle(OffMeTheme.muted)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 32)
                    } else {
                        ForEach(viewModel.trending) { post in
                            PostRowView(post: post)
                            Divider().overlay(OffMeTheme.border)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var usersContent: some View {
        if viewModel.users.isEmpty {
            Text("Nenhum usuário encontrado para \"\(viewModel.debouncedQuery)\".")
                .foregroundStyle(OffMeTheme.muted)
                .multilineTextAlignment(.center)
                .padding()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            List(viewModel.users) { user in
                HStack(spacing: 12) {
                    NavigationLink(value: user.username) {
                        HStack(spacing: 12) {
                            UserAvatarView(url: user.avatarUrl, size: 44)

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

    @ViewBuilder
    private var postsContent: some View {
        if viewModel.posts.isEmpty {
            Text("Nenhum post encontrado para \"\(viewModel.debouncedQuery)\".")
                .foregroundStyle(OffMeTheme.muted)
                .multilineTextAlignment(.center)
                .padding()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(viewModel.posts) { post in
                        PostRowView(post: post)
                        Divider().overlay(OffMeTheme.border)
                    }
                }
            }
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