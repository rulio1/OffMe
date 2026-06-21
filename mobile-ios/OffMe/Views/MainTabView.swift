import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var unreadCount = 0
    @State private var selectedTab = 0

    var body: some View {
        VStack(spacing: 0) {
            tabContent
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            BottomTabBar(selectedTab: $selectedTab, unreadCount: unreadCount)
        }
        .background(OffMeTheme.bg)
        .offMeChrome()
        .task {
            await refreshUnread()
        }
        .onChange(of: selectedTab) { newValue in
            if newValue == 3 {
                Task { await refreshUnread() }
            }
        }
    }

    @ViewBuilder
    private var tabContent: some View {
        switch selectedTab {
        case 0:
            NavigationStack { FeedView() }
        case 1:
            NavigationStack { ExploreView() }
        case 2:
            NavigationStack { GrokView() }
        case 3:
            NavigationStack { NotificationsView() }
        case 4:
            NavigationStack { MessagesView() }
        default:
            NavigationStack { FeedView() }
        }
    }

    private func refreshUnread() async {
        guard let token = auth.accessToken else { return }
        do {
            let res = try await APIClient.shared.fetchNotifications(token: token)
            unreadCount = res.unreadCount
        } catch {
            unreadCount = 0
        }
    }
}