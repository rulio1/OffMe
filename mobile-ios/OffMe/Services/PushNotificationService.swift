import Foundation
import UserNotifications
import UIKit

@MainActor
final class PushNotificationService: NSObject, UNUserNotificationCenterDelegate {
    static let shared = PushNotificationService()
    private var pendingDeviceToken: Data?

    func handleDeviceToken(_ deviceToken: Data) {
        pendingDeviceToken = deviceToken
    }

    func syncPendingToken(authToken: String) async {
        guard let token = pendingDeviceToken else { return }
        await registerToken(token, authToken: authToken)
    }

    func registerIfNeeded() {
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            guard granted else { return }
            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    func registerToken(_ deviceToken: Data, authToken: String) async {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        do {
            try await APIClient.shared.registerPushToken(token: token, platform: "ios", authToken: authToken)
        } catch {
            // graceful no-op when push is not configured server-side
        }
    }
}