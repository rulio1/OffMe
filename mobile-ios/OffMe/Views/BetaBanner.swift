import SwiftUI

/// Banner discreto indicando o status beta, com atalho para Feedback.
struct BetaBanner: View {
    var onTapFeedback: () -> Void
    @AppStorage("betaBannerDismissed") private var dismissed = false

    var body: some View {
        if !dismissed {
            HStack(spacing: 10) {
                Image(systemName: "sparkles")
                    .foregroundStyle(.white)
                    .font(.subheadline.weight(.semibold))
                VStack(alignment: .leading, spacing: 1) {
                    Text("OffMe está em beta")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                    Text("Toque para enviar feedback")
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.8))
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(.white.opacity(0.7))
                    .font(.footnote)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(OffMeTheme.accent.gradient, in: RoundedRectangle(cornerRadius: 12))
            .contentShape(RoundedRectangle(cornerRadius: 12))
            .overlay(alignment: .topTrailing) {
                Button {
                    dismissed = true
                } label: {
                    Image(systemName: "xmark")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(.white.opacity(0.8))
                        .padding(6)
                        .contentShape(Rectangle())
                }
                .padding(4)
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 6)
            .onTapGesture { onTapFeedback() }
            .transition(.move(edge: .top).combined(with: .opacity))
        }
    }
}