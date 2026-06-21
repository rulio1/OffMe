import SwiftUI

struct UserAvatarView: View {
    var url: String?
    var size: CGFloat = 40

    var body: some View {
        Group {
            if let url, let imageUrl = URL(string: url) {
                AsyncImage(url: imageUrl) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFill()
                    default:
                        placeholder
                    }
                }
            } else {
                placeholder
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }

    private var placeholder: some View {
        Circle()
            .fill(OffMeTheme.surface)
            .overlay(Circle().strokeBorder(OffMeTheme.border, lineWidth: 0.5))
    }
}