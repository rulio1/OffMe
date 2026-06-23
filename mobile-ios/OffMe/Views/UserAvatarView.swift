import SwiftUI

struct UserAvatarView: View {
    var url: String?
    var size: CGFloat = 40

    var body: some View {
        Group {
            if let resolved = resolveImageURL(url), let imageUrl = URL(string: resolved) {
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

    private func resolveImageURL(_ url: String?) -> String? {
        guard let url, !url.isEmpty else { return nil }
        if url.hasPrefix("http://") || url.hasPrefix("https://") { return url }
        return "https://offme.vercel.app" + (url.hasPrefix("/") ? url : "/\(url)")
    }

    private var placeholder: some View {
        Circle()
            .fill(OffMeTheme.surface)
            .overlay(Circle().strokeBorder(OffMeTheme.border, lineWidth: 0.5))
    }
}