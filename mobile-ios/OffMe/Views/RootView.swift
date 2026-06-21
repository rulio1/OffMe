import SwiftUI

struct RootView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var showSplash = true

    var body: some View {
        ZStack {
            Group {
                if auth.isBootstrapping {
                    Color.clear
                } else if auth.isAuthenticated {
                    MainTabView()
                } else {
                    LoginView()
                }
            }
            .opacity(showSplash ? 0 : 1)

            if showSplash {
                SplashView {
                    withAnimation(.easeOut(duration: 0.25)) {
                        showSplash = false
                    }
                }
                .transition(.opacity)
            }
        }
    }
}