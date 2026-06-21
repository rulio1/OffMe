import SwiftUI

struct OffMeLogoView: View {
    var size: CGFloat = 42

    var body: some View {
        Image("Logo")
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .accessibilityLabel("OffMe")
    }
}