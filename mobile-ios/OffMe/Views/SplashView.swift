import SwiftUI

struct SplashView: View {
    var onFinish: () -> Void

    @State private var logoScale: CGFloat = 0.72
    @State private var logoOpacity: Double = 0
    @State private var logoOffset: CGFloat = 28
    @State private var glowOpacity: Double = 0
    @State private var glowScale: CGFloat = 0.6
    @State private var ringScale: CGFloat = 0.7
    @State private var ringOpacity: Double = 0
    @State private var overlayOpacity: Double = 1

    var body: some View {
        ZStack {
            OffMeTheme.bg.ignoresSafeArea()

            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            OffMeTheme.accent.opacity(0.28),
                            OffMeTheme.accent.opacity(0.04),
                            .clear,
                        ],
                        center: .center,
                        startRadius: 8,
                        endRadius: 120
                    )
                )
                .frame(width: 240, height: 240)
                .scaleEffect(glowScale)
                .opacity(glowOpacity)
                .blur(radius: 18)

            ZStack {
                Circle()
                    .stroke(OffMeTheme.accent.opacity(0.35), lineWidth: 1.5)
                    .frame(width: 112, height: 112)
                    .scaleEffect(ringScale)
                    .opacity(ringOpacity)

                OffMeLogoView(size: 88)
                    .scaleEffect(logoScale)
                    .opacity(logoOpacity)
                    .offset(y: logoOffset)
            }
        }
        .opacity(overlayOpacity)
        .onAppear(perform: runAnimation)
    }

    private func runAnimation() {
        withAnimation(.spring(response: 0.72, dampingFraction: 0.78)) {
            logoScale = 1
            logoOpacity = 1
            logoOffset = 0
            glowOpacity = 1
            glowScale = 1
        }

        withAnimation(.easeOut(duration: 0.9).delay(0.18)) {
            ringScale = 1.9
            ringOpacity = 0.55
        }

        withAnimation(.easeOut(duration: 0.7).delay(0.55)) {
            ringOpacity = 0
            ringScale = 2.4
        }

        withAnimation(.easeInOut(duration: 0.55).delay(0.85)) {
            logoScale = 1.04
            glowScale = 1.08
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.15) {
            withAnimation(.easeInOut(duration: 0.22)) {
                logoScale = 1
                glowScale = 1
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.35) {
            withAnimation(.easeInOut(duration: 0.42)) {
                logoScale = 1.12
                logoOpacity = 0
                glowOpacity = 0
                overlayOpacity = 0
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.42) {
                onFinish()
            }
        }
    }
}