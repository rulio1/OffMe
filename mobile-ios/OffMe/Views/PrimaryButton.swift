import SwiftUI

struct PrimaryButton: View {
    let title: String
    let variant: ButtonVariant
    let size: ButtonSize
    let action: () -> Void
    let isLoading: Bool
    let isDisabled: Bool

    enum ButtonVariant {
        case filled
        case outline
        case ghost
        case destructive
        case success
    }

    enum ButtonSize {
        case small
        case medium
        case large
    }

    init(
        _ title: String,
        variant: ButtonVariant = .filled,
        size: ButtonSize = .medium,
        isLoading: Bool = false,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.variant = variant
        self.size = size
        self.isLoading = isLoading
        self.isDisabled = isDisabled
        self.action = action
    }

    private var buttonColors: (background: Color, foreground: Color, border: Color) {
        switch variant {
        case .filled:
            return (OffMeTheme.text, OffMeTheme.bg, .clear)
        case .outline:
            return (.clear, OffMeTheme.text, OffMeTheme.border)
        case .ghost:
            return (.clear, OffMeTheme.text, .clear)
        case .destructive:
            return (Color.red, Color.white, .clear)
        case .success:
            return (Color.green, Color.white, .clear)
        }
    }

    private var buttonPadding: (horizontal: CGFloat, vertical: CGFloat) {
        switch size {
        case .small:
            return (12, 6)
        case .medium:
            return (16, 10)
        case .large:
            return (20, 14)
        }
    }

    private var fontStyle: Font {
        switch size {
        case .small:
            return .subheadline.weight(.semibold)
        case .medium:
            return .body.weight(.semibold)
        case .large:
            return .title3.weight(.semibold)
        }
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: buttonColors.foreground))
                } else {
                    Text(title)
                }
            }
            .font(fontStyle)
            .foregroundColor(buttonColors.foreground)
            .padding(.horizontal, buttonPadding.horizontal)
            .padding(.vertical, buttonPadding.vertical)
            .background(buttonColors.background)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(buttonColors.border, lineWidth: variant == .outline ? 1 : 0)
            )
            .cornerRadius(8)
            .opacity(isDisabled || isLoading ? 0.6 : 1.0)
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(isDisabled || isLoading)
        .animation(.easeInOut(duration: 0.2), value: isLoading)
    }
}

struct PrimaryButton_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            PrimaryButton("Primary", variant: .filled) {}
            PrimaryButton("Outline", variant: .outline) {}
            PrimaryButton("Ghost", variant: .ghost) {}
            PrimaryButton("Destructive", variant: .destructive) {}
            PrimaryButton("Success", variant: .success) {}

            PrimaryButton("Small", variant: .filled, size: .small) {}
            PrimaryButton("Medium", variant: .filled, size: .medium) {}
            PrimaryButton("Large", variant: .filled, size: .large) {}

            PrimaryButton("Loading", variant: .filled, isLoading: true) {}
            PrimaryButton("Disabled", variant: .filled, isDisabled: true) {}
        }
        .padding()
        .background(OffMeTheme.bg)
        .previewLayout(.sizeThatFits)
    }
}