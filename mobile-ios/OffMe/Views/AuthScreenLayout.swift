import SwiftUI

/// Centraliza formulários de autenticação na tela e permite rolagem com o teclado aberto.
struct AuthScreenLayout<Content: View>: View {
    @ViewBuilder let content: () -> Content

    var body: some View {
        GeometryReader { proxy in
            ScrollView {
                content()
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: proxy.size.height, alignment: .center)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 32)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .offMeScreenBackground()
    }
}