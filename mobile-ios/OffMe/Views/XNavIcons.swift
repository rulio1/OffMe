import SwiftUI

enum XNavIconKind: String, CaseIterable {
    case home
    case search
    case notifications
    case messages
    case bookmarks
    case profile
    case more
    case lists
    case communities
    case settings
    case admin
}

struct XNavIcon: View {
    let kind: XNavIconKind
    var active = false

    var body: some View {
        Image(systemName: symbolName)
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: 26, height: 26)
            .foregroundStyle(active ? OffMeTheme.text : OffMeTheme.text.opacity(0.78))
            .scaleEffect(active ? 1.04 : 1)
            .animation(.easeOut(duration: 0.18), value: active)
    }

    private var symbolName: String {
        switch kind {
        case .home:
            return active ? "house.fill" : "house"
        case .search:
            return "magnifyingglass"
        case .notifications:
            return active ? "bell.fill" : "bell"
        case .messages:
            return active ? "envelope.fill" : "envelope"
        case .bookmarks:
            return active ? "bookmark.fill" : "bookmark"
        case .profile:
            return active ? "person.fill" : "person"
        case .more:
            return "ellipsis"
        case .lists:
            return active ? "list.bullet.rectangle.fill" : "list.bullet.rectangle"
        case .communities:
            return active ? "person.2.fill" : "person.2"
        case .settings:
            return "gearshape"
        case .admin:
            return active ? "shield.fill" : "shield"
        }
    }
}
