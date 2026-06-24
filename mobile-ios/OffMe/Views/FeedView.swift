import SwiftUI

enum FeedTab: String, CaseIterable {
    case forYou = "Para você"
    case following = "Seguindo"
}

@MainActor
final class FeedViewModel: ObservableObject {
    private struct TabCache {
        var posts: [Post]
        var nextCursor: String?
        var fetchedAt: Date
    }

    @Published var tab: FeedTab = .forYou
    @Published var posts: [Post] = []
    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var nextCursor: String?
    @Published var error: String?

    private var cache: [FeedTab: TabCache] = [:]
    private let staleInterval: TimeInterval = 120
    private var loadTask: Task<Void, Never>?

    func load(token: String, reset: Bool = true, force: Bool = false) async {
        loadTask?.cancel()
        loadTask = Task {
            if reset {
                if !force,
                   let cached = cache[tab],
                   Date().timeIntervalSince(cached.fetchedAt) < staleInterval {
                    posts = cached.posts
                    nextCursor = cached.nextCursor
                    return
                }
                isLoading = true
                nextCursor = nil
            }
            error = nil
            defer { if reset { isLoading = false } }

            do {
                let response: TimelineResponse
                switch tab {
                case .forYou:
                    response = try await APIClient.shared.forYouTimeline(token: token)
                case .following:
                    response = try await APIClient.shared.homeTimeline(token: token)
                }
                guard !Task.isCancelled else { return }
                posts = response.entries.compactMap { $0.post }
                nextCursor = response.nextCursor
                cache[tab] = TabCache(
                    posts: posts,
                    nextCursor: nextCursor,
                    fetchedAt: Date()
                )
            } catch {
                guard !Task.isCancelled else { return }
                self.error = error.localizedDescription
            }
        }
        await loadTask?.value
    }

    func loadMore(token: String) async {
        guard let cursor = nextCursor, !isLoadingMore else { return }
        isLoadingMore = true
        defer { isLoadingMore = false }

        do {
            let response: TimelineResponse
            switch tab {
            case .forYou:
                response = try await APIClient.shared.forYouTimeline(token: token, cursor: cursor)
            case .following:
                response = try await APIClient.shared.homeTimeline(token: token, cursor: cursor)
            }
            posts.append(contentsOf: response.entries.compactMap { $0.post })
            nextCursor = response.nextCursor
        } catch {
            self.error = error.localizedDescription
        }
    }
}

private struct FeedHeaderView: View {
    @Binding var tab: FeedTab
    var avatarUrl: String?
    var profileUsername: String?
    var onAvatarTap: (() -> Void)? = nil
    var onComposeTap: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                if let onAvatarTap {
                    Button(action: onAvatarTap) {
                        UserAvatarView(url: avatarUrl, size: 32)
                    }
                    .buttonStyle(.plain)
                } else if let profileUsername {
                    NavigationLink(value: profileUsername) {
                        UserAvatarView(url: avatarUrl, size: 32)
                    }
                    .buttonStyle(.plain)
                } else {
                    UserAvatarView(url: avatarUrl, size: 32)
                }

                Spacer()

                OffMeLogoView(size: 32)

                Spacer()

                if let profileUsername {
                    NavigationLink(value: profileUsername) {
                        Image(systemName: "person.crop.circle.badge.plus")
                            .font(.system(size: 22, weight: .regular))
                            .foregroundStyle(OffMeTheme.text)
                            .frame(width: 32, height: 32)
                    }
                    .buttonStyle(.plain)
                } else {
                    Image(systemName: "person.crop.circle.badge.plus")
                        .font(.system(size: 22, weight: .regular))
                        .foregroundStyle(OffMeTheme.text)
                        .frame(width: 32, height: 32)
                }
            }
            .padding(.horizontal, 16)
            .frame(height: 53)

            HStack(spacing: 0) {
                ForEach(FeedTab.allCases, id: \.self) { item in
                    Button {
                        tab = item
                    } label: {
                        VStack(spacing: 0) {
                            HStack(spacing: 2) {
                                Text(item.rawValue)
                                    .font(.system(size: 15, weight: tab == item ? .bold : .medium))
                                    .foregroundStyle(tab == item ? OffMeTheme.text : OffMeTheme.muted)

                                if tab == item {
                                    Image(systemName: "chevron.down")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundStyle(OffMeTheme.text)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 49)

                            if tab == item {
                                Capsule()
                                    .fill(OffMeTheme.accent)
                                    .frame(width: 56, height: 4)
                            } else {
                                Color.clear.frame(height: 4)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }

                Button {
                    onComposeTap?()
                } label: {
                    VStack(spacing: 0) {
                        HStack(spacing: 6) {
                            Text("Add +")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(OffMeTheme.muted)
                            Circle()
                                .fill(OffMeTheme.accent)
                                .frame(width: 6, height: 6)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 49)

                        Color.clear.frame(height: 4)
                    }
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Novo post")
            }
        }
        .background(OffMeTheme.bg.opacity(0.92))
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(OffMeTheme.border)
                .frame(height: 0.5)
        }
    }
}

struct FeedView: View {
    @EnvironmentObject private var auth: AuthStore
    @ObservedObject var viewModel: FeedViewModel
    @Binding var resetTrigger: Bool
    @State private var showCompose = false
    @State private var showSideMenu = false
    @State private var navigateToBookmarks = false
    @State private var navigateToProfile = false
    @State private var navigateToLists = false
    @State private var navigateToCommunities = false
    @State private var navigateToVerification = false
    @State private var showSettingsHub = false

    init(viewModel: FeedViewModel, resetTrigger: Binding<Bool>? = nil) {
        self.viewModel = viewModel
        _resetTrigger = resetTrigger ?? .constant(false)
    }

    var body: some View {
        rootContent
            .onChange(of: resetTrigger) { _ in
                if let token = auth.accessToken {
                    Task {
                        await viewModel.load(token: token, force: true)
                    }
                }
            }
    }

    private var rootContent: some View {
        ZStack(alignment: .bottomTrailing) {
            VStack(spacing: 0) {
                FeedHeaderView(
                    tab: $viewModel.tab,
                    avatarUrl: auth.session?.user.avatarUrl,
                    profileUsername: auth.session?.user.username,
                    onAvatarTap: { showSideMenu = true },
                    onComposeTap: { showCompose = true }
                )

                if let token = auth.accessToken {
                    feedContent(token: token)
                }
            }
            .gesture(
                DragGesture(minimumDistance: 30, coordinateSpace: .local)
                    .onEnded { value in
                        // swipe from left edge to right to open side menu
                        if value.startLocation.x < 50 && value.translation.width > 80 {
                            showSideMenu = true
                        }
                    }
            )

            Button {
                showCompose = true
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 56, height: 56)
                    .background(Circle().fill(OffMeTheme.accent))
                    .shadow(color: .black.opacity(0.18), radius: 8, y: 4)
            }
            .padding(.trailing, 16)
            .padding(.bottom, 12)
            .accessibilityLabel("Novo post")
        }
        .background(OffMeTheme.bg)
        .toolbar(.hidden, for: .navigationBar)
        .navigationDestination(for: String.self) { username in
            ProfileView(username: username)
        }
        .navigationDestination(for: Int.self) { postId in
            PostThreadView(postId: postId)
        }
        .navigationDestination(isPresented: $navigateToBookmarks) {
            BookmarksView()
        }
        .navigationDestination(isPresented: $navigateToProfile) {
            if let username = auth.session?.user.username {
                ProfileView(username: username)
            }
        }
        .navigationDestination(isPresented: $navigateToLists) {
            ListsView()
        }
        .navigationDestination(isPresented: $navigateToCommunities) {
            CommunitiesView()
        }
        .navigationDestination(isPresented: $navigateToVerification) {
            VerificationSettingsView()
        }
        .sheet(isPresented: $showSettingsHub) {
            SettingsHubView(
                onVerification: { navigateToVerification = true },
                onLists: { navigateToLists = true },
                onCommunities: { navigateToCommunities = true }
            )
            .environmentObject(auth)
        }
        .sheet(isPresented: $showCompose) {
            if let token = auth.accessToken {
                NavigationStack {
                    ComposerBar { text, mediaIds, scheduledAt in
                        _ = try await APIClient.shared.createPost(
                            text: text,
                            token: token,
                            mediaIds: mediaIds.isEmpty ? nil : mediaIds,
                            scheduledAt: scheduledAt
                        )
                        await viewModel.load(token: token, force: true)
                    }
                    .padding(.top, 8)
                    .navigationTitle("Novo post")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            Button("Fechar") { showCompose = false }
                        }
                    }
                }
                .presentationDetents([.large])
            }
        }
        .sheet(isPresented: $showSideMenu) {
            SideMenuSheet {
                showSideMenu = false
            } content: {
                SideMenuView(
                    onProfile: {
                        showSideMenu = false
                        navigateToProfile = true
                    },
                    onBookmarks: {
                        showSideMenu = false
                        navigateToBookmarks = true
                    },
                    onLists: {
                        showSideMenu = false
                        navigateToLists = true
                    },
                    onCommunities: {
                        showSideMenu = false
                        navigateToCommunities = true
                    },
                    onVerification: {
                        showSideMenu = false
                        navigateToVerification = true
                    },
                    onSettings: {
                        showSideMenu = false
                        showSettingsHub = true
                    }
                )
            }
        }
        .task(id: viewModel.tab) {
            if let token = auth.accessToken {
                await viewModel.load(token: token)
            }
        }
    }

    @ViewBuilder
    private func feedContent(token: String) -> some View {
        Group {
            if viewModel.isLoading && viewModel.posts.isEmpty {
                ProgressView("Carregando...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error = viewModel.error, viewModel.posts.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "wifi.exclamationmark")
                        .font(.largeTitle)
                        .foregroundStyle(OffMeTheme.muted)
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
                    Text("Nenhum post ainda")
                        .font(.title3.weight(.heavy))
                    Text("Seja o primeiro a publicar.")
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
                                .onAppear {
                                    if post.id == viewModel.posts.last?.id,
                                       viewModel.nextCursor != nil,
                                       !viewModel.isLoadingMore {
                                        Task { await viewModel.loadMore(token: token) }
                                    }
                                }
                            Divider().overlay(OffMeTheme.border)
                        }

                        if viewModel.isLoadingMore {
                            Text("Carregando...")
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(OffMeTheme.accent)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                        }
                    }
                }
                .refreshable {
                    await viewModel.load(token: token, force: true)
                }
            }
        }
    }
}
private struct SideMenuSheet<Content: View>: View {
    let onDismiss: () -> Void
    @ViewBuilder let content: Content

    var body: some View {
        ZStack(alignment: .leading) {
            Color.black.opacity(0.35)
                .ignoresSafeArea()
                .onTapGesture { onDismiss() }

            content
                .frame(width: 286)
                .frame(maxHeight: .infinity, alignment: .top)
                .background(OffMeTheme.bg)
                .shadow(color: .black.opacity(0.12), radius: 10, x: 4, y: 0)
        }
        .ignoresSafeArea()
        .presentationDetents([.large])
        .presentationDragIndicator(.hidden)
    }
}

private struct SideMenuView: View {
    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss
    var onProfile: () -> Void = {}
    var onBookmarks: () -> Void = {}
    var onLists: () -> Void = {}
    var onCommunities: () -> Void = {}
    var onVerification: () -> Void = {}
    var onSettings: () -> Void = {}

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let user = auth.session?.user {
                VStack(alignment: .leading, spacing: 10) {
                    UserAvatarView(url: user.avatarUrl, size: 52)

                    VStack(alignment: .leading, spacing: 3) {
                        Text(user.displayName)
                            .font(.system(size: 19, weight: .bold, design: .rounded))
                            .foregroundStyle(OffMeTheme.text)
                            .lineLimit(1)

                        Text("@" + user.username)
                            .font(.system(size: 15, weight: .regular))
                            .foregroundStyle(OffMeTheme.muted)
                            .lineLimit(1)
                    }

                    HStack(spacing: 18) {
                        if let following = user.followingCount {
                            label(count: following, singular: "Seguindo", plural: "Seguindo")
                        }
                        if let followers = user.followerCount {
                            label(count: followers, singular: "Seguidor", plural: "Seguidores")
                        }
                    }
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(OffMeTheme.muted)
                    .padding(.top, 4)
                }
                .padding(.top, 18)
                .padding(.bottom, 14)
            } else {
                Color.clear
                    .frame(height: 18)
            }

            Divider().overlay(OffMeTheme.border)

            VStack(alignment: .leading, spacing: 0) {
                SideMenuRow(icon: "person", title: "Perfil") { onProfile(); dismiss() }
                SideMenuRow(icon: "bookmark", title: "Salvos") { onBookmarks() }
                SideMenuRow(icon: "list.bullet", title: "Listas") { onLists() }
                SideMenuRow(icon: "person.2", title: "Comunidades") { onCommunities() }
                SideMenuRow(icon: "checkmark.seal", title: "Verificação") { onVerification() }
                SideMenuRow(icon: "gearshape", title: "Configurações") { onSettings() }
            }
            .padding(.top, 10)
            .padding(.bottom, 8)

            Spacer()

            Divider().overlay(OffMeTheme.border)

            Button {
                auth.logout()
                dismiss()
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 18, weight: .medium))
                        .frame(width: 24, alignment: .center)
                    Text("Sair")
                        .font(.system(size: 16, weight: .medium))
                    Spacer()
                }
                .foregroundStyle(.red)
                .padding(.vertical, 14)
            }
            .padding(.horizontal, 16)
        }
        .padding(.horizontal, 16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(OffMeTheme.bg)
    }

    private func label(count: Int, singular: String, plural: String) -> some View {
        HStack(spacing: 3) {
            Text("\(count)")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(OffMeTheme.text)
            Text(count == 1 ? singular : plural)
                .font(.system(size: 14, weight: .regular))
        }
    }
}

private struct SideMenuRow: View {
    let icon: String
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .medium))
                    .foregroundStyle(OffMeTheme.text)
                    .frame(width: 24, height: 24, alignment: .center)
                Text(title)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(OffMeTheme.text)
                Spacer()
            }
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
