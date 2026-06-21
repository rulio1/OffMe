import SwiftUI

struct RootView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var showSplash = true
    @State private var contentVisible = false

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
            .opacity(contentVisible ? 1 : 0)
            .scaleEffect(contentVisible ? 1 : 0.98)
            .animation(.easeOut(duration: 0.45), value: contentVisible)

            if showSplash {
                SplashView {
                    showSplash = false
                    contentVisible = true
                }
                .transition(.opacity)
                .zIndex(1)
            }
        }
        .onAppear {
            contentVisible = false
        }
    }
}