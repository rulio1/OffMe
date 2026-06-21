import SwiftUI

@MainActor
final class BookmarksViewModel: ObservableObject {
    @Published var posts: [Post] = []
    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var nextCursor: String?
    @Published var error: String?

    func load(token: String, reset: Bool = true) async {
        if reset {
            isLoading = true
            nextCursor = nil
        }
        error = nil
        defer { if reset { isLoading = false } }

        do {
            let response = try await APIClient.shared.fetchBookmarks(token: token)
            posts = response.entries.compactMap { $0.post }
            nextCursor = response.nextCursor
        } catch {
            self.error = error.localizedDescription
        }
    }

    func loadMore(token: String) async {
        guard let cursor = nextCursor, !isLoadingMore else { return }
        isLoadingMore = true
        defer { isLoadingMore = false }

        do {
            let response = try await APIClient.shared.fetchBookmarks(token: token, cursor: cursor)
            posts.append(contentsOf: response.entries.compactMap { $0.post })
            nextCursor = response.nextCursor
        } catch {
            self.error = error.localizedDescription
        }
    }
}

struct BookmarksView: View {
    @EnvironmentObject private var auth: AuthStore
    @StateObject private var viewModel = BookmarksViewModel()

    var body: some View {
        Group {
            if let token = auth.accessToken {
                content(token: token)
            } else {
                Text("Faça login para ver seus salvos.")
                    .foregroundStyle(OffMeTheme.muted)
            }
        }
        .background(OffMeTheme.bg)
        .navigationTitle("Salvos")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if let token = auth.accessToken {
                await viewModel.load(token: token)
            }
        }
        .navigationDestination(for: String.self) { username in
            ProfileView(username: username)
        }
        .navigationDestination(for: Int.self) { postId in
            PostThreadView(postId: postId)
        }
    }

    @ViewBuilder
    private func content(token: String) -> some View {
        if viewModel.isLoading && viewModel.posts.isEmpty {
            ProgressView("Carregando...")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let error = viewModel.error, viewModel.posts.isEmpty {
            VStack(spacing: 8) {
                Text("Erro ao carregar")
                    .font(.headline)
                Text(error)
                    .font(.subheadline)
                    .foregroundStyle(OffMeTheme.muted)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding()
        } else if viewModel.posts.isEmpty {
            VStack(spacing: 8) {
                Image(systemName: "bookmark")
                    .font(.largeTitle)
                    .foregroundStyle(OffMeTheme.muted)
                Text("Nenhum post salvo")
                    .font(.title3.weight(.heavy))
                Text("Salve posts para ler depois.")
                    .font(.subheadline)
                    .foregroundStyle(OffMeTheme.muted)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding()
        } else {
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(viewModel.posts) { post in
                        PostRowView(post: post)
                        Divider().overlay(OffMeTheme.border)
                    }

                    if viewModel.nextCursor != nil {
                        Button {
                            Task { await viewModel.loadMore(token: token) }
                        } label: {
                            Text(viewModel.isLoadingMore ? "Carregando..." : "Mostrar mais")
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(OffMeTheme.accent)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                        }
                        .disabled(viewModel.isLoadingMore)
                    }
                }
            }
            .refreshable {
                await viewModel.load(token: token)
            }
        }
    }
}