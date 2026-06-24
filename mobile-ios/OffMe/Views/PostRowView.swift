import SwiftUI
import UIKit

struct PostRowView: View {
    private static let timeFormatter: RelativeDateTimeFormatter = {
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = Locale(identifier: "pt_BR")
        formatter.unitsStyle = .short
        return formatter
    }()

    let post: Post

    @EnvironmentObject private var auth: AuthStore
    @State private var liked: Bool
    @State private var likeCount: Int
    @State private var liking = false

    @State private var reposted: Bool
    @State private var repostCount: Int
    @State private var reposting = false

    @State private var bookmarked: Bool
    @State private var bookmarking = false

    @State private var dismissed = false
    @State private var showShareSheet = false
    @State private var showDeleteConfirm = false
    @State private var deleting = false

    init(post: Post) {
        self.post = post
        _liked = State(initialValue: post.likedByMe ?? false)
        _likeCount = State(initialValue: post.likeCount)
        _reposted = State(initialValue: post.repostedByMe ?? false)
        _repostCount = State(initialValue: post.repostCount)
        _bookmarked = State(initialValue: post.bookmarkedByMe ?? false)
    }

    private var authorName: String {
        post.author?.displayName ?? "Usuário"
    }

    private var username: String {
        post.author?.username ?? "usuario"
    }

    private var isOwnPost: Bool {
        guard let currentUserId = auth.session?.user.id else { return false }
        if post.authorId == currentUserId { return true }
        return post.author?.id == currentUserId
    }

    private var shareURL: URL {
        URL(string: "https://offme.vercel.app/post/\(post.id)")!
    }

    private var timeAgo: String {
        let date = Date(timeIntervalSince1970: TimeInterval(post.createdAt) / 1000)
        return Self.timeFormatter.localizedString(for: date, relativeTo: Date())
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
                HStack(spacing: 4) {
                    ActionIconView(kind: .repost, size: 14, color: OffMeTheme.muted)
                    Text("Repost")
                        .font(.system(size: 13))
                        .foregroundStyle(OffMeTheme.muted)
                }
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

                                if post.author?.isOfficial == true {
                                    OfficialBadgeIOS()
                                } else if post.author?.verified == true {
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

                        postMenu
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
                            kind: .reply,
                            count: post.replyCount,
                            color: OffMeTheme.muted,
                            destination: post.id
                        )

                        Button {
                            Task { await toggleRepost() }
                        } label: {
                            actionLabel(
                                kind: .repost,
                                count: repostCount,
                                color: reposted ? OffMeTheme.repost : OffMeTheme.muted,
                                isFilled: reposted
                            )
                        }
                        .buttonStyle(.plain)
                        .disabled(reposting)

                        Button {
                            Task { await toggleLike() }
                        } label: {
                            actionLabel(
                                kind: .like,
                                count: likeCount,
                                color: liked ? OffMeTheme.like : OffMeTheme.muted,
                                isFilled: liked
                            )
                        }
                        .buttonStyle(.plain)
                        .disabled(liking)

                        actionLabel(
                            kind: .views,
                            count: viewCount,
                            color: OffMeTheme.muted
                        )

                        Button {
                            showShareSheet = true
                        } label: {
                            ActionIconView(kind: .share, size: 18, color: OffMeTheme.muted)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Compartilhar")

                        Button {
                            Task { await toggleBookmark() }
                        } label: {
                            ActionIconView(kind: .bookmark, size: 18,
                                color: bookmarked ? OffMeTheme.accent : OffMeTheme.muted,
                                isFilled: bookmarked)
                                .opacity(bookmarked ? 1.0 : 0.5)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.plain)
                        .disabled(bookmarking)
                        .accessibilityLabel(bookmarked ? "Remover dos salvos" : "Salvar post")
                    }
                    .padding(.top, 8)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .background(OffMeTheme.bg)
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(items: [shareURL])
                .presentationDetents([.medium, .large])
        }
        .confirmationDialog(
            "Excluir este post?",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Excluir", role: .destructive) {
                Task { await deletePost() }
            }
            Button("Cancelar", role: .cancel) {}
        } message: {
            Text("Esta ação não pode ser desfeita.")
        }
    }

    @ViewBuilder
    private var postMenu: some View {
        Menu {
            if isOwnPost {
                Button(role: .destructive) {
                    showDeleteConfirm = true
                } label: {
                    Label("Excluir post", systemImage: "trash")
                }
                .disabled(deleting)
            }

            Button {
                dismissed = true
            } label: {
                Label("Ocultar post", systemImage: "xmark")
            }
        } label: {
            Image(systemName: "ellipsis")
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(OffMeTheme.muted)
                .padding(8)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func actionButton(
        kind: ActionIconKind,
        count: Int,
        color: Color,
        destination: Int
    ) -> some View {
        NavigationLink(value: destination) {
            actionLabel(kind: kind, count: count, color: color, isFilled: false)
        }
        .buttonStyle(.plain)
    }

    private func actionLabel(kind: ActionIconKind, count: Int, color: Color, isFilled: Bool = false, iconOpacity: Double = 1.0) -> some View {
        HStack(spacing: 4) {
            ActionIconView(kind: kind, size: 18, color: color, isFilled: isFilled)
                .opacity(iconOpacity)
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

    private func toggleBookmark() async {
        guard let token = auth.accessToken, !bookmarking else { return }
        bookmarking = true
        let wasBookmarked = bookmarked
        bookmarked = !wasBookmarked
        defer { bookmarking = false }

        do {
            let result: BookmarkPostResponse
            if wasBookmarked {
                result = try await APIClient.shared.unbookmarkPost(postId: post.id, token: token)
            } else {
                result = try await APIClient.shared.bookmarkPost(postId: post.id, token: token)
            }
            bookmarked = result.bookmarkedByMe
        } catch {
            bookmarked = wasBookmarked
        }
    }

    private func deletePost() async {
        guard let token = auth.accessToken, !deleting else { return }
        deleting = true
        defer { deleting = false }

        do {
            try await APIClient.shared.deletePost(postId: post.id, token: token)
            dismissed = true
        } catch {
            // Keep post visible on failure
        }
    }
}

struct OfficialBadgeIOS: View {
    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 14))
                .foregroundStyle(OffMeTheme.accent)
        }
        .accessibilityLabel("Conta oficial")
    }
}

private struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
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