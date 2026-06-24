import SwiftUI

@MainActor
final class ProfileViewModel: ObservableObject {
    @Published var user: User?
    @Published var isOwnProfile = false
    @Published var posts: [Post] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var isFollowing = false

    func load(username: String, token: String) async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            async let profile = APIClient.shared.userProfile(username: username, token: token)
            async let timeline = APIClient.shared.userPosts(username: username, token: token)
            let (profileRes, timelineRes) = try await (profile, timeline)
            user = profileRes.user
            isOwnProfile = profileRes.isOwnProfile
            isFollowing = profileRes.user.isFollowing ?? false
            posts = timelineRes.entries.compactMap { $0.post }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

struct AvatarView: View {
    let url: String?
    let size: CGFloat

    var body: some View {
        Group {
            if let resolved = resolveImageURL(url), let imageUrl = URL(string: resolved) {
                AsyncImage(url: imageUrl) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFill()
                    } else if let url, url.hasPrefix("/brand/") {
                        OffMeLogoView(size: size)
                    } else {
                        Circle().fill(OffMeTheme.border)
                    }
                }
            } else if let url, url.hasPrefix("/brand/") {
                OffMeLogoView(size: size)
            } else {
                Circle().fill(OffMeTheme.border)
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }

    private func resolveImageURL(_ url: String?) -> String? {
        guard let url, !url.isEmpty else { return nil }
        if url.hasPrefix("http://") || url.hasPrefix("https://") { return url }
        return "https://offme.vercel.app" + (url.hasPrefix("/") ? url : "/\(url)")
    }
}

struct ProfileView: View {
    let username: String

    @EnvironmentObject private var auth: AuthStore
    @StateObject private var viewModel = ProfileViewModel()
    @State private var showEdit = false
    @State private var startingDm = false
    @State private var reporting = false
    @State private var showReportConfirm = false
    @State private var conversationId: Int?

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.user == nil {
                ProgressView("Carregando perfil...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error = viewModel.error, viewModel.user == nil {
                VStack(spacing: 8) {
                    Image(systemName: "person.crop.circle.badge.exclamationmark")
                        .font(.largeTitle)
                        .foregroundStyle(OffMeTheme.muted)
                    Text("Perfil não encontrado")
                        .font(.headline)
                    Text(error)
                        .font(.subheadline)
                        .foregroundStyle(OffMeTheme.muted)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding()
            } else if let user = viewModel.user {
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        profileHeader(user: user)

                        Divider().overlay(OffMeTheme.border)

                        if viewModel.posts.isEmpty {
                            Text(viewModel.isOwnProfile
                                 ? "Você ainda não publicou nada."
                                 : "Este usuário ainda não publicou nada.")
                                .foregroundStyle(OffMeTheme.muted)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 32)
                        } else {
                            LazyVStack(spacing: 0) {
                                ForEach(viewModel.posts) { post in
                                    PostRowView(post: post)
                                    Divider().overlay(OffMeTheme.border)
                                }
                            }
                        }
                    }
                }
                .refreshable {
                    if let token = auth.accessToken {
                        await viewModel.load(username: username, token: token)
                    }
                }
            }
        }
        .background(OffMeTheme.bg)
        .navigationTitle(viewModel.user?.displayName ?? username)
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: String.self) { nestedUsername in
            ProfileView(username: nestedUsername)
        }
        .navigationDestination(for: Int.self) { postId in
            PostThreadView(postId: postId)
        }
        .background {
            if let conversationId {
                NavigationLink(
                    destination: ConversationThreadView(conversationId: conversationId),
                    isActive: Binding(
                        get: { self.conversationId != nil },
                        set: { if !$0 { self.conversationId = nil } }
                    )
                ) { EmptyView() }
            }
        }
        .sheet(isPresented: $showEdit) {
            if let user = viewModel.user {
                EditProfileView(user: user) { updated in
                    viewModel.user = updated
                }
            }
        }
        .confirmationDialog(
            "Denunciar @\(viewModel.user?.username ?? username)?",
            isPresented: $showReportConfirm,
            titleVisibility: .visible
        ) {
            Button("Denunciar usuário", role: .destructive) {
                Task { await reportUser() }
            }
            Button("Cancelar", role: .cancel) {}
        }
        .task {
            if let token = auth.accessToken {
                await viewModel.load(username: username, token: token)
            }
        }
    }

    private func reportUser() async {
        guard let token = auth.accessToken, let user = viewModel.user else { return }
        reporting = true
        defer { reporting = false }
        do {
            try await APIClient.shared.reportUser(username: user.username, reason: "abuse", token: token)
        } catch {
            viewModel.error = error.localizedDescription
        }
    }

    @ViewBuilder
    private func profileHeader(user: User) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Group {
            if let banner = user.bannerUrl, !banner.isEmpty, let resolved = resolveBannerURL(banner), let url = URL(string: resolved) {
                AsyncImage(url: url) { phase in
                    if case .success(let image) = phase {
                        image.resizable().scaledToFill()
                    } else if banner.hasPrefix("/brand/") {
                        OffMeLogoView(size: 120)
                            .frame(maxWidth: .infinity)
                            .clipped()
                    } else {
                        Rectangle().fill(OffMeTheme.surface)
                    }
                }
            } else if let banner = user.bannerUrl, banner.hasPrefix("/brand/") {
                OffMeLogoView(size: 120)
                    .frame(maxWidth: .infinity)
                    .clipped()
            } else {
                Rectangle().fill(OffMeTheme.surface)
            }
            }
            .frame(height: 120)
            .frame(maxWidth: .infinity)
            .clipped()

            HStack(alignment: .top) {
                AvatarView(url: user.avatarUrl, size: 72)
                    .overlay(Circle().stroke(OffMeTheme.bg, lineWidth: 4))
                    .offset(y: -36)
                    .padding(.bottom, -36)

                Spacer()

                if viewModel.isOwnProfile {
                    Button("Editar perfil") { showEdit = true }
                        .font(.subheadline.weight(.bold))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .overlay(Capsule().stroke(OffMeTheme.border, lineWidth: 1))
                } else {
                    HStack(spacing: 8) {
                        Button(startingDm ? "..." : "Mensagem") {
                            Task { await startMessage(username: user.username) }
                        }
                        .font(.subheadline.weight(.bold))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .overlay(Capsule().stroke(OffMeTheme.border, lineWidth: 1))
                        .disabled(startingDm)

                        FollowButton(
                            username: user.username,
                            isFollowing: $viewModel.isFollowing
                        ) { updated in
                            viewModel.user = updated
                        }
                    }
                }
            }
            .padding(.horizontal, 16)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 4) {
                    Text(user.displayName)
                        .font(.title2.bold())
                    if user.isOfficial {
                        OfficialBadgeIOS()
                    } else if user.verified {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundStyle(OffMeTheme.accent)
                    }
                }
                Text("@\(user.username)")
                    .foregroundStyle(OffMeTheme.muted)

                if let bio = user.bio, !bio.isEmpty {
                    Text(bio)
                        .padding(.top, 4)
                }

                if let location = user.location, !location.isEmpty {
                    Label(location, systemImage: "mappin.and.ellipse")
                        .font(.subheadline)
                        .foregroundStyle(OffMeTheme.muted)
                        .padding(.top, 4)
                }

                if let website = user.websiteUrl, !website.isEmpty,
                   let url = URL(string: website.hasPrefix("http") ? website : "https://\(website)") {
                    Link(destination: url) {
                        Label(website, systemImage: "link")
                            .font(.subheadline)
                    }
                    .padding(.top, 2)
                }

                HStack(spacing: 16) {
                    HStack(spacing: 4) {
                        Text(Formatters.count(user.followingCount ?? 0)).fontWeight(.bold)
                        Text("seguindo")
                    }
                    HStack(spacing: 4) {
                        Text(Formatters.count(user.followerCount ?? 0)).fontWeight(.bold)
                        Text("seguidores")
                    }
                }
                .font(.subheadline)
                .foregroundStyle(OffMeTheme.muted)
                .padding(.top, 4)

                if !viewModel.isOwnProfile {
                    Button(reporting ? "..." : "Denunciar usuário") {
                        showReportConfirm = true
                    }
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(.red)
                    .padding(.top, 8)
                    .disabled(reporting)
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
        }
    }

    private func resolveBannerURL(_ url: String) -> String? {
        if url.hasPrefix("http://") || url.hasPrefix("https://") { return url }
        return "https://offme.vercel.app" + (url.hasPrefix("/") ? url : "/\(url)")
    }

    private func startMessage(username: String) async {
        guard let token = auth.accessToken, !startingDm else { return }
        startingDm = true
        defer { startingDm = false }
        do {
            let conversation = try await APIClient.shared.startConversation(username: username, token: token)
            conversationId = conversation.id
        } catch {
            viewModel.error = error.localizedDescription
        }
    }
}