import SwiftUI
import UIKit

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        Task { @MainActor in
            PushNotificationService.shared.handleDeviceToken(deviceToken)
        }
    }
}

@main
struct OffMeApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var auth = AuthStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(auth)
                .preferredColorScheme(.light)
                .onAppear {
                    PushNotificationService.shared.registerIfNeeded()
                }
                .task(id: auth.accessToken) {
                    if let token = auth.accessToken {
                        await PushNotificationService.shared.syncPendingToken(authToken: token)
                    }
                }
        }
    }
}