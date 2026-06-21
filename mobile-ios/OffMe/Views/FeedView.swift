import SwiftUI

enum FeedTab: String, CaseIterable {
    case forYou = "For you"
    case following = "Following"
}

@MainActor
final class FeedViewModel: ObservableObject {
    @Published var tab: FeedTab = .forYou
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
            let response: TimelineResponse
            switch tab {
            case .forYou:
                response = try await APIClient.shared.forYouTimeline(token: token)
            case .following:
                response = try await APIClient.shared.homeTimeline(token: token)
            }
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

                Button {} label: {
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
    @StateObject private var viewModel = FeedViewModel()
    @State private var showCompose = false
    @State private var showSideMenu = false
    @State private var navigateToBookmarks = false
    @State private var navigateToProfile = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            VStack(spacing: 0) {
                FeedHeaderView(
                    tab: $viewModel.tab,
                    avatarUrl: auth.session?.user.avatarUrl,
                    profileUsername: auth.session?.user.username,
                    onAvatarTap: { showSideMenu = true }
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
        .sheet(isPresented: $showCompose) {
            if let token = auth.accessToken {
                NavigationStack {
                    ComposerBar { text, mediaIds in
                        _ = try await APIClient.shared.createPost(
                            text: text,
                            token: token,
                            mediaIds: mediaIds.isEmpty ? nil : mediaIds
                        )
                        await viewModel.load(token: token)
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
            ZStack(alignment: .leading) {
                Color.black.opacity(0.35)
                    .ignoresSafeArea()
                    .onTapGesture { showSideMenu = false }
                
                SideMenuView(
                    onProfile: {
                        showSideMenu = false
                        navigateToProfile = true
                    },
                    onBookmarks: {
                        showSideMenu = false
                        navigateToBookmarks = true
                    }
                )
                    .frame(width: 280)
                    .background(OffMeTheme.bg)
                    .shadow(radius: 5)
            }
            .ignoresSafeArea()
            .presentationDetents([.large])
            .presentationDragIndicator(.hidden)
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
}
private struct SideMenuView: View {
    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss
    var onProfile: () -> Void = {}
    var onBookmarks: () -> Void = {}

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let user = auth.session?.user {
                VStack(alignment: .leading, spacing: 8) {
                    UserAvatarView(url: user.avatarUrl, size: 48)
                        .padding(.top, 12)
                    
                    Text(user.displayName ?? user.username)
                        .font(.title3.bold())
                    
                    Text("@" + user.username)
                        .foregroundStyle(OffMeTheme.muted)
                    
                    HStack(spacing: 16) {
                        if let following = user.followingCount {
                            (Text("\(following) ").bold() + Text("Seguindo").foregroundColor(OffMeTheme.muted))
                        }
                        if let followers = user.followerCount {
                            (Text("\(followers) ").bold() + Text("Seguidores").foregroundColor(OffMeTheme.muted))
                        }
                    }
                    .font(.subheadline)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
            }
            
            Divider().overlay(OffMeTheme.border)
            
            VStack(alignment: .leading, spacing: 0) {
                SideMenuRow(icon: "person", title: "Perfil") {
                    onProfile()
                    dismiss()
                }
                SideMenuRow(icon: "bookmark", title: "Salvos") {
                    onBookmarks()
                }
                SideMenuRow(icon: "list.bullet", title: "Listas") {
                    dismiss()
                }
                SideMenuRow(icon: "person.2", title: "Comunidades") {
                    dismiss()
                }
            }
            .padding(.vertical, 8)
            
            Spacer()
            
            Divider().overlay(OffMeTheme.border)
            
            Button {
                auth.logout()
                dismiss()
            } label: {
                HStack {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                    Text("Sair")
                }
                .foregroundStyle(.red)
                .padding(.vertical, 12)
            }
            .padding(.horizontal, 16)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(OffMeTheme.bg)
    }
}

private struct SideMenuRow: View {
    let icon: String
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .frame(width: 26)
                Text(title)
                    .font(.body)
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
