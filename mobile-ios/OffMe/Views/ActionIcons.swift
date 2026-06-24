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
        Group {
            switch kind {
            case .reply:
                Image(systemName: "arrowshape.turn.up.left")
            case .repost:
                Image(systemName: "arrow.2.squarepath")
            case .like:
                Image(systemName: isFilled ? "heart.fill" : "heart")
            case .likeFilled:
                Image(systemName: "heart.fill")
            case .views:
                Image(systemName: "eye")
            case .share:
                Image(systemName: "arrowshape.turn.up.right")
            case .bookmark:
                Image(systemName: isFilled ? "bookmark.fill" : "bookmark")
            case .bookmarkFilled:
                Image(systemName: "bookmark.fill")
            }
        }
        .frame(width: size, height: size)
        .foregroundColor(color)
        .accessibilityHidden(true)
    }
}
