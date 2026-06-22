import SwiftUI

@MainActor
final class PostThreadViewModel: ObservableObject {
    @Published var post: Post?
    @Published var replies: [Post] = []
    @Published var isLoading = false
    @Published var error: String?

    func load(postId: Int, token: String) async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            async let fetchedPost = APIClient.shared.fetchPost(postId: postId, token: token)
            async let fetchedReplies = APIClient.shared.fetchPostReplies(postId: postId, token: token)
            let (p, r) = try await (fetchedPost, fetchedReplies)
            post = p
            replies = r.entries.compactMap { $0.post }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

struct PostThreadView: View {
    let postId: Int

    @EnvironmentObject private var auth: AuthStore
    @StateObject private var viewModel = PostThreadViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.post == nil {
                ProgressView("Carregando...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error = viewModel.error, viewModel.post == nil {
                Text(error)
                    .foregroundStyle(.red)
                    .padding()
            } else if let post = viewModel.post {
                ScrollView {
                    VStack(spacing: 0) {
                        PostRowView(post: post)

                        Divider().overlay(OffMeTheme.border)

                        if let token = auth.accessToken {
                            ComposerBar(placeholder: "Poste sua resposta") { text, mediaIds, _ in
                                _ = try await APIClient.shared.createPost(
                                    text: text,
                                    token: token,
                                    replyToId: postId,
                                    mediaIds: mediaIds.isEmpty ? nil : mediaIds
                                )
                                await viewModel.load(postId: postId, token: token)
                            }
                        }

                        Text(viewModel.replies.isEmpty
                             ? "Nenhuma resposta ainda"
                             : "\(post.replyCount) resposta\(post.replyCount == 1 ? "" : "s")")
                            .font(.subheadline)
                            .foregroundStyle(OffMeTheme.muted)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding()

                        ForEach(viewModel.replies) { reply in
                            PostRowView(post: reply)
                            Divider().overlay(OffMeTheme.border)
                        }
                    }
                }
                .refreshable {
                    if let token = auth.accessToken {
                        await viewModel.load(postId: postId, token: token)
                    }
                }
            }
        }
        .background(OffMeTheme.bg)
        .navigationTitle("Post")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: String.self) { username in
            ProfileView(username: username)
        }
        .navigationDestination(for: Int.self) { id in
            PostThreadView(postId: id)
        }
        .task {
            if let token = auth.accessToken {
                await viewModel.load(postId: postId, token: token)
            }
        }
    }
}