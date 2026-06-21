import SwiftUI

// Estilo Liquid Glass (iOS 26). Com Xcode 15 usamos material + blur;
// no iPhone com iOS 26+ o visual fica ainda mais fluido pelo sistema.
enum LiquidGlass {
    static let cornerRadius: CGFloat = 22
    static let pillRadius: CGFloat = 999
}

struct LiquidGlassBackdrop: View {
    var body: some View {
        ZStack {
            OffMeTheme.bg

            Circle()
                .fill(OffMeTheme.accent.opacity(0.14))
                .frame(width: 280, height: 280)
                .blur(radius: 70)
                .offset(x: -110, y: -220)

            Circle()
                .fill(Color(red: 0.45, green: 0.25, blue: 0.95).opacity(0.1))
                .frame(width: 240, height: 240)
                .blur(radius: 80)
                .offset(x: 130, y: 60)

            Circle()
                .fill(OffMeTheme.repost.opacity(0.08))
                .frame(width: 200, height: 200)
                .blur(radius: 60)
                .offset(x: -40, y: 320)
        }
        .ignoresSafeArea()
    }
}

struct LiquidGlassSurface: View {
    var cornerRadius: CGFloat = LiquidGlass.cornerRadius
    var tint: Color = Color.black.opacity(0.03)

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(.ultraThinMaterial)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(tint)
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(
                        LinearGradient(
                            colors: [
                                .white.opacity(0.95),
                                .black.opacity(0.06),
                                .black.opacity(0.03),
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 0.75
                    )
            )
            .shadow(color: .black.opacity(0.08), radius: 12, y: 4)
    }
}

extension View {
    func offMeScreenBackground() -> some View {
        background {
            LiquidGlassBackdrop()
        }
    }

    func liquidGlassCard(
        cornerRadius: CGFloat = LiquidGlass.cornerRadius,
        contentPadding: CGFloat = 16
    ) -> some View {
        self.padding(contentPadding)
            .background {
                LiquidGlassSurface(cornerRadius: cornerRadius)
            }
    }

    func liquidGlassField() -> some View {
        self
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background {
                LiquidGlassSurface(cornerRadius: 16, tint: Color.black.opacity(0.02))
            }
    }

    func liquidGlassCapsuleButton(fill: Color = OffMeTheme.accent) -> some View {
        self
            .fontWeight(.bold)
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background {
                Capsule(style: .continuous)
                    .fill(fill)
                    .overlay(
                        Capsule(style: .continuous)
                            .strokeBorder(.white.opacity(0.25), lineWidth: 0.5)
                    )
                    .shadow(color: fill.opacity(0.35), radius: 12, y: 4)
            }
            .foregroundStyle(.white)
    }

    func offMeChrome() -> some View {
        toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarBackground(.ultraThinMaterial, for: .tabBar)
            .toolbarBackground(.visible, for: .tabBar)
    }
}