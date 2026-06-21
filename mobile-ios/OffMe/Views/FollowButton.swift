import SwiftUI

struct FollowButton: View {
    let username: String
    @Binding var isFollowing: Bool
    var onUpdate: ((User) -> Void)?

    @EnvironmentObject private var auth: AuthStore
    @State private var loading = false

    var body: some View {
        Button {
            Task { await toggle() }
        } label: {
            Text(loading ? "..." : (isFollowing ? "Seguindo" : "Seguir"))
                .font(.subheadline.weight(.bold))
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isFollowing ? Color.clear : OffMeTheme.text)
                .foregroundStyle(isFollowing ? OffMeTheme.text : OffMeTheme.bg)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(isFollowing ? OffMeTheme.border : Color.clear, lineWidth: 1)
                )
                .clipShape(Capsule())
        }
        .disabled(loading)
    }

    private func toggle() async {
        guard let token = auth.accessToken else { return }
        loading = true
        defer { loading = false }

        do {
            let updated: User
            if isFollowing {
                updated = try await APIClient.shared.unfollowUser(username: username, token: token)
            } else {
                updated = try await APIClient.shared.followUser(username: username, token: token)
            }
            isFollowing = updated.isFollowing ?? !isFollowing
            onUpdate?(updated)
        } catch {
            // mantém estado atual
        }
    }
}