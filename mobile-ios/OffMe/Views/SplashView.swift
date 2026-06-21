import SwiftUI

struct SplashView: View {
    var onFinish: () -> Void

    @State private var logoScale: CGFloat = 0.38
    @State private var logoOpacity: Double = 0
    @State private var logoRotation: Double = -14
    @State private var logoBlur: CGFloat = 10
    @State private var ringScale: CGFloat = 0.55
    @State private var ringOpacity: Double = 0.45
    @State private var overlayOpacity: Double = 1

    var body: some View {
        ZStack {
            OffMeTheme.bg.ignoresSafeArea()

            ZStack {
                Circle()
                    .stroke(OffMeTheme.accent.opacity(0.25), lineWidth: 2)
                    .frame(width: 120, height: 120)
                    .scaleEffect(ringScale)
                    .opacity(ringOpacity)

                OffMeLogoView(size: 88)
                    .scaleEffect(logoScale)
                    .opacity(logoOpacity)
                    .rotationEffect(.degrees(logoRotation))
                    .blur(radius: logoBlur)
            }
        }
        .opacity(overlayOpacity)
        .onAppear(perform: runAnimation)
    }

    private func runAnimation() {
        withAnimation(.spring(response: 0.55, dampingFraction: 0.62)) {
            logoScale = 1
            logoOpacity = 1
            logoRotation = 0
            logoBlur = 0
        }

        withAnimation(.easeOut(duration: 0.85).delay(0.12)) {
            ringScale = 1.75
            ringOpacity = 0
        }

        withAnimation(.easeInOut(duration: 0.55).delay(0.72)) {
            logoScale = 1.045
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.95) {
            withAnimation(.easeInOut(duration: 0.2)) {
                logoScale = 1
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.1) {
            withAnimation(.easeIn(duration: 0.32)) {
                logoScale = 0.95
                logoOpacity = 0
                overlayOpacity = 0
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.32) {
                onFinish()
            }
        }
    }
}