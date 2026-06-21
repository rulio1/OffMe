import SwiftUI

enum XNavIconKind {
    case home
    case search
    case bookmarks
    case notifications
    case messages
}

struct XNavIcon: View {
    let kind: XNavIconKind
    var active = false

    private var symbolName: String {
        switch kind {
        case .home:
            return active ? "house.fill" : "house"
        case .search:
            return "magnifyingglass"
        case .bookmarks:
            return active ? "bookmark.fill" : "bookmark"
        case .notifications:
            return active ? "bell.fill" : "bell"
        case .messages:
            return active ? "envelope.fill" : "envelope"
        }
    }

    var body: some View {
        Image(systemName: symbolName)
            .font(.system(size: 22, weight: active ? .semibold : .regular))
            .symbolRenderingMode(.monochrome)
            .frame(width: 26, height: 26)
            .foregroundStyle(OffMeTheme.text.opacity(active ? 1 : 0.78))
            .scaleEffect(active ? 1.04 : 1)
            .animation(.easeOut(duration: 0.18), value: active)
    }
}