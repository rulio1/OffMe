import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var auth: AuthStore
    @StateObject private var feedVM = FeedViewModel()
    @State private var unreadCount = 0
    @State private var selectedTab = 0
    @State private var showFeedback = false
    @State private var resetFeedTrigger = false
    @State private var feedPath = NavigationPath()

    var body: some View {
        VStack(spacing: 0) {
            BetaBanner(onTapFeedback: { showFeedback = true })

            ZStack {
                NavigationStack(path: $feedPath) {
                    FeedView(viewModel: feedVM, resetTrigger: $resetFeedTrigger)
                }
                .opacity(selectedTab == 0 ? 1 : 0)
                .allowsHitTesting(selectedTab == 0)

                NavigationStack { ExploreView() }
                    .opacity(selectedTab == 1 ? 1 : 0)
                    .allowsHitTesting(selectedTab == 1)

                NavigationStack { NotificationsView() }
                    .opacity(selectedTab == 2 ? 1 : 0)
                    .allowsHitTesting(selectedTab == 2)

                NavigationStack { MessagesView() }
                    .opacity(selectedTab == 3 ? 1 : 0)
                    .allowsHitTesting(selectedTab == 3)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            BottomTabBar(
                selectedTab: $selectedTab,
                unreadCount: unreadCount,
                onHomeDoubleTap: {
                    if selectedTab == 0 {
                        if !feedPath.isEmpty {
                            feedPath.removeLast(feedPath.count)
                        } else {
                            resetFeedTrigger.toggle()
                        }
                    }
                }
            )
        }
        .background(OffMeTheme.bg)
        .offMeChrome()
        .sheet(isPresented: $showFeedback) {
            FeedbackView()
                .environmentObject(auth)
        }
        .task {
            await refreshUnread()
        }
        .onChange(of: selectedTab) { newValue in
            if newValue == 3 {
                Task { await refreshUnread() }
            }
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