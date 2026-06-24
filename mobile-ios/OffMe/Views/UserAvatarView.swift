import SwiftUI

struct UserAvatarView: View {
    var url: String?
    var size: CGFloat = 40
    var isOnline: Bool = false

    var body: some View {
        Group {
            if let resolved = resolveImageURL(url), let imageUrl = URL(string: resolved) {
                AsyncImage(url: imageUrl) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFill()
                    } else if let url, url.hasPrefix("/brand/") {
                        OffMeLogoView(size: size)
                    } else {
                        placeholder
                    }
                }
            } else if let url, url.hasPrefix("/brand/") {
                OffMeLogoView(size: size)
            } else {
                placeholder
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
        .overlay(
            Group {
                if isOnline {
                    Circle()
                        .stroke(Color.green, lineWidth: 2)
                        .padding(2)
                } else {
                    Circle()
                        .stroke(OffMeTheme.border, lineWidth: 1)
                }
            }
        )
    }

    private func resolveImageURL(_ url: String?) -> String? {
        guard let url, !url.isEmpty else { return nil }
        if url.hasPrefix("http://") || url.hasPrefix("https://") { return url }
        return "https://offme.vercel.app" + (url.hasPrefix("/") ? url : "/\(url)")
    }

    private var placeholder: some View {
        Circle()
            .fill(OffMeTheme.surface)
    }
}
