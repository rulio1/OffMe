import SwiftUI

struct CommunityDetailView: View {
    let communityId: Int
    @EnvironmentObject private var auth: AuthStore
    @State private var community: OffMeCommunity?
    @State private var posts: [Post] = []
    @State private var isLoading = false
    @State private var error: String?
    @State private var showJoinAlert = false
    @State private var isJoining = false

    var body: some View {
        Group {
            if isLoading && community == nil {
                ProgressView("Carregando comunidade...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error = error, community == nil {
                errorView(error: error)
            } else if let community = community {
                mainContent(community: community)
            }
        }
        .background(OffMeTheme.bg)
        .navigationTitle(community?.name ?? "Comunidade")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadData()
        }
        .refreshable {
            await loadData()
        }
        .alert("Entrar na comunidade", isPresented: $showJoinAlert) {
            Button("Cancelar", role: .cancel) {}
            Button("Confirmar") {
                Task { await joinCommunity() }
            }
        } message: {
            Text("Deseja entrar na comunidade \(community?.name ?? "")?")
        }
    }

    @ViewBuilder
    private func errorView(error: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "person.2.fill")
                .font(.largeTitle)
                .foregroundStyle(OffMeTheme.muted)
            Text("Não foi possível carregar a comunidade")
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
    private func mainContent(community: OffMeCommunity) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Header
                VStack(alignment: .leading, spacing: 12) {
                    HStack(alignment: .top) {
                        if let bannerUrl = community.bannerUrl, !bannerUrl.isEmpty {
                            AsyncImage(url: URL(string: resolveImageURL(bannerUrl))) { phase in
                                if let image = phase.image {
                                    image.resizable()
                                        .scaledToFill()
                                        .frame(height: 120)
                                        .clipped()
                                } else {
                                    Rectangle()
                                        .fill(OffMeTheme.surface)
                                        .frame(height: 120)
                                }
                            }
                        } else {
                            Rectangle()
                                .fill(OffMeTheme.surface)
                                .frame(height: 120)
                        }
                    }

                    HStack(spacing: 16) {
                        if let avatarUrl = community.avatarUrl, !avatarUrl.isEmpty {
                            AsyncImage(url: URL(string: resolveImageURL(avatarUrl))) { phase in
                                if let image = phase.image {
                                    image.resizable()
                                        .scaledToFill()
                                        .frame(width: 64, height: 64)
                                        .clipShape(Circle())
                                        .overlay(Circle().stroke(OffMeTheme.bg, lineWidth: 3))
                                } else {
                                    Circle()
                                        .fill(OffMeTheme.border)
                                        .frame(width: 64, height: 64)
                                }
                            }
                            .offset(y: -32)
                            .padding(.bottom, -32)
                        }

                        Spacer()

                        Button(action: {
                            showJoinAlert = true
                        }) {
                            if isJoining {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .padding(8)
                            } else {
                                Text(community.isMember ? "Sair" : "Entrar")
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(
                                        Capsule()
                                            .fill(community.isMember ? OffMeTheme.muted : OffMeTheme.accent)
                                    )
                            }
                        }
                        .disabled(isJoining)
                    }
                    .padding(.horizontal, 16)

                    VStack(alignment: .leading, spacing: 8) {
                        Text(community.name)
                            .font(.title2.bold())

                        if let description = community.description, !description.isEmpty {
                            Text(description)
                                .font(.body)
                                .foregroundStyle(OffMeTheme.text)
                        }

                        HStack(spacing: 16) {
                            HStack(spacing: 4) {
                                Text("\(community.memberCount ?? 0)")
                                    .fontWeight(.bold)
                                Text("membros")
                            }

                            HStack(spacing: 4) {
                                Text("\(community.postCount ?? 0)")
                                    .fontWeight(.bold)
                                Text("posts")
                            }
                        }
                        .font(.subheadline)
                        .foregroundStyle(OffMeTheme.muted)
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)
                }

                Divider()
                    .overlay(OffMeTheme.border)
                    .padding(.vertical, 8)

                // Posts
                if posts.isEmpty {
                    Text("Nenhum post nesta comunidade ainda.")
                        .foregroundStyle(OffMeTheme.muted)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 32)
                } else {
                    LazyVStack(spacing: 0) {
                        ForEach(posts) { post in
                            PostRowView(post: post)
                            Divider().overlay(OffMeTheme.border)
                        }
                    }
                }
            }
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
            async let communityData = APIClient.shared.fetchCommunityDetail(communityId: communityId, token: token)
            async let postsData = APIClient.shared.fetchCommunityPosts(communityId: communityId, token: token)

            let (communityResponse, postsResponse) = try await (communityData, postsData)
            community = communityResponse
            posts = postsResponse.entries.compactMap { $0.post }
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    private func joinCommunity() async {
        guard let token = auth.accessToken, let community = community else { return }

        isJoining = true
        error = nil

        do {
            let updatedCommunity = try await APIClient.shared.toggleCommunityMembership(
                communityId: communityId,
                join: !community.isMember,
                token: token
            )
            self.community = updatedCommunity
        } catch {
            self.error = error.localizedDescription
        }

        isJoining = false
    }
}

// MARK: - API Extensions

extension APIClient {
    func fetchCommunityDetail(communityId: Int, token: String) async throws -> OffMeCommunity {
        struct Response: Decodable {
            let community: OffMeCommunity
        }

        let response: Response = try await request("/communities/\(communityId)", token: token)
        return response.community
    }

    func fetchCommunityPosts(communityId: Int, token: String) async throws -> TimelineResponse {
        let response: TimelineResponse = try await request("/communities/\(communityId)/posts", token: token)
        return response
    }

    func toggleCommunityMembership(communityId: Int, join: Bool, token: String) async throws -> OffMeCommunity {
        struct Response: Decodable {
            let community: OffMeCommunity
        }

        let endpoint = join ? "/communities/\(communityId)/join" : "/communities/\(communityId)/leave"
        let response: Response = try await request(endpoint, method: join ? "POST" : "DELETE", token: token)
        return response.community
    }
}