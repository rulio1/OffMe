import SwiftUI

struct FeaturePlaceholderView: View {
    let title: String
    let icon: String
    let description: String

    var body: some View {
        VStack(spacing: 0) {
            VStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.system(size: 44))
                    .foregroundStyle(OffMeTheme.muted)

                Text("Em breve")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(OffMeTheme.text)

                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(OffMeTheme.muted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(.vertical, 32)
        }
        .background(OffMeTheme.bg)
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}