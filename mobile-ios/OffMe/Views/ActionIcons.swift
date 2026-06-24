import SwiftUI

enum ActionIconKind: String, CaseIterable {
    case reply
    case repost
    case like
    case likeFilled
    case views
    case share
    case bookmark
    case bookmarkFilled
}

struct ActionIconView: View {
    let kind: ActionIconKind
    var size: CGFloat = 18
    var color: Color = .secondary
    var isFilled: Bool = false

    var body: some View {
        Image(systemName: symbolName)
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: size, height: size)
            .foregroundColor(color)
            .accessibilityHidden(true)
    }

    private var symbolName: String {
        switch kind {
        case .reply:
            return "arrowshape.turn.up.left"
        case .repost:
            return "arrow.2.squarepath"
        case .like:
            return isFilled ? "heart.fill" : "heart"
        case .likeFilled:
            return "heart.fill"
        case .views:
            return "eye"
        case .share:
            return "arrowshape.turn.up.right"
        case .bookmark:
            return isFilled ? "bookmark.fill" : "bookmark"
        case .bookmarkFilled:
            return "bookmark.fill"
        }
    }
}
