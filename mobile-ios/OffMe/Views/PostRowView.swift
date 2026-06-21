import SwiftUI

struct PostRowView: View {
    let post: Post

    @EnvironmentObject private var auth: AuthStore
    @State private var liked: Bool
    @State private var likeCount: Int
    @State private var liking = false

    @State private var reposted: Bool
    @State private var repostCount: Int
    @State private var reposting = false

    @State private var dismissed = false

    init(post: Post) {
        self.post = post
        _liked = State(initialValue: post.likedByMe ?? false)
        _likeCount = State(initialValue: post.likeCount)
        _reposted = State(initialValue: post.repostedByMe ?? false)
        _repostCount = State(initialValue: post.repostCount)
    }

    private var authorName: String {
        post.author?.displayName ?? "Usuário"
    }

    private var username: String {
        post.author?.username ?? "usuario"
    }

    private var timeAgo: String {
        let date = Date(timeIntervalSince1970: TimeInterval(post.createdAt) / 1000)
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = Locale(identifier: "pt_BR")
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }

    private var viewCount: Int {
        max(post.likeCount * 3 + post.replyCount * 2, post.likeCount)
    }

    var body: some View {
        if dismissed {
            EmptyView()
        } else {
            postContent
        }
    }

    private var postContent: some View {
        VStack(alignment: .leading, spacing: 0) {
            if post.timelineSource == "repost" {
                Label("Repost", systemImage: "arrow.2.squarepath")
                    .font(.system(size: 13))
                    .foregroundStyle(OffMeTheme.muted)
                    .padding(.leading, 52)
                    .padding(.bottom, 8)
            }

            HStack(alignment: .top, spacing: 12) {
                NavigationLink(value: username) {
                    UserAvatarView(url: post.author?.avatarUrl, size: 40)
                }
                .buttonStyle(.plain)

                VStack(alignment: .leading, spacing: 4) {
                    HStack(alignment: .top, spacing: 4) {
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(spacing: 4) {
                                NavigationLink(value: username) {
                                    Text(authorName)
                                        .font(.system(size: 15, weight: .bold))
                                        .foregroundStyle(OffMeTheme.text)
                                        .lineLimit(1)
                                }
                                .buttonStyle(.plain)

                                if post.author?.verified == true {
                                    Image(systemName: "checkmark.seal.fill")
                                        .font(.system(size: 14))
                                        .foregroundStyle(OffMeTheme.accent)
                                }

                                Text("@\(username)")
                                    .font(.system(size: 15))
                                    .foregroundStyle(OffMeTheme.muted)
                                    .lineLimit(1)

                                Text("·")
                                    .foregroundStyle(OffMeTheme.muted)

                                Text(timeAgo)
                                    .font(.system(size: 15))
                                    .foregroundStyle(OffMeTheme.muted)
                            }
                        }

                        Spacer(minLength: 0)

                        Button {
                            dismissed = true
                        } label: {
                            Image(systemName: "xmark")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(OffMeTheme.muted)
                                .padding(6)
                        }
                        .buttonStyle(.plain)
                    }

                    if !post.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Text(post.text)
                            .font(.system(size: 15))
                            .foregroundStyle(OffMeTheme.text)
                            .lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    if let urls = post.mediaUrls, !urls.isEmpty {
                        PostMediaGrid(urls: urls)
                            .padding(.top, 4)
                    }

                    HStack {
                        actionButton(
                            systemName: "bubble.right",
                            count: post.replyCount,
                            color: OffMeTheme.muted,
                            destination: post.id
                        )

                        Button {
                            Task { await toggleRepost() }
                        } label: {
                            actionLabel(
                                systemName: "arrow.2.squarepath",
                                count: repostCount,
                                color: reposted ? OffMeTheme.repost : OffMeTheme.muted
                            )
                        }
                        .buttonStyle(.plain)
                        .disabled(reposting)

                        Button {
                            Task { await toggleLike() }
                        } label: {
                            actionLabel(
                                systemName: liked ? "heart.fill" : "heart",
                                count: likeCount,
                                color: liked ? OffMeTheme.like : OffMeTheme.muted
                            )
                        }
                        .buttonStyle(.plain)
                        .disabled(liking)

                        actionLabel(
                            systemName: "chart.bar",
                            count: viewCount,
                            color: OffMeTheme.muted
                        )

                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 16))
                            .foregroundStyle(OffMeTheme.muted)
                            .frame(maxWidth: .infinity)
                    }
                    .padding(.top, 8)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .background(OffMeTheme.bg)
    }

    @ViewBuilder
    private func actionButton(
        systemName: String,
        count: Int,
        color: Color,
        destination: Int
    ) -> some View {
        NavigationLink(value: destination) {
            actionLabel(systemName: systemName, count: count, color: color)
        }
        .buttonStyle(.plain)
    }

    private func actionLabel(systemName: String, count: Int, color: Color) -> some View {
        HStack(spacing: 4) {
            Image(systemName: systemName)
                .font(.system(size: 16))
            if count > 0 {
                Text(Formatters.count(count))
                    .font(.system(size: 13))
            }
        }
        .foregroundStyle(color)
        .frame(maxWidth: .infinity)
    }

    private func toggleLike() async {
        guard let token = auth.accessToken, !liking else { return }
        liking = true
        let wasLiked = liked
        liked = !wasLiked
        likeCount = wasLiked ? max(likeCount - 1, 0) : likeCount + 1
        defer { liking = false }

        do {
            let result: LikePostResponse
            if wasLiked {
                result = try await APIClient.shared.unlikePost(postId: post.id, token: token)
            } else {
                result = try await APIClient.shared.likePost(postId: post.id, token: token)
            }
            liked = result.likedByMe
            likeCount = result.likeCount
        } catch {
            liked = wasLiked
            likeCount = post.likeCount
        }
    }

    private func toggleRepost() async {
        guard let token = auth.accessToken, !reposting else { return }
        reposting = true
        let wasReposted = reposted
        reposted = !wasReposted
        repostCount = wasReposted ? max(repostCount - 1, 0) : repostCount + 1
        defer { reposting = false }

        do {
            let result: RepostPostResponse
            if wasReposted {
                result = try await APIClient.shared.unrepostPost(postId: post.id, token: token)
            } else {
                result = try await APIClient.shared.repostPost(postId: post.id, token: token)
            }
            reposted = result.repostedByMe
            repostCount = result.repostCount
        } catch {
            reposted = wasReposted
            repostCount = post.repostCount
        }
    }

}

private struct PostMediaGrid: View {
    let urls: [String]

    var body: some View {
        Group {
            if urls.count == 1, let urlString = urls.first, let url = URL(string: urlString) {
                mediaImage(url: url)
                    .frame(maxHeight: 280)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            } else {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 2) {
                    ForEach(urls, id: \.self) { urlString in
                        if let url = URL(string: urlString) {
                            mediaImage(url: url)
                                .frame(minHeight: 120, maxHeight: 180)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .strokeBorder(OffMeTheme.border, lineWidth: 0.5)
                )
            }
        }
    }

    @ViewBuilder
    private func mediaImage(url: URL) -> some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .success(let image):
                image.resizable().scaledToFill()
            default:
                Rectangle().fill(OffMeTheme.surface)
            }
        }
        .clipped()
    }
}