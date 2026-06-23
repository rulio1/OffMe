import SwiftUI

/// Ícones de ação modernos e consistentes (iOS / Android / Web).
/// Design 2024 com traços limpos, cantos arredondados e estados outline/filled.
struct ActionIconShape {
    let name: String
    let buildPath: (inout Path) -> Void

    init(name: String, buildPath: @escaping (inout Path) -> Void) {
        self.name = name
        self.buildPath = buildPath
    }
}

enum ActionIcons {
    // MARK: - Reply
    static let reply = ActionIconShape(name: "ActionReply") { path in
        path.move(to: CGPoint(x: 1.751, y: 10))
        path.addCurve(to: CGPoint(x: 9.756, y: 2),
            control1: CGPoint(x: 1.751, y: 5.58),
            control2: CGPoint(x: 5.335, y: 2))
        path.addLine(to: CGPoint(x: 14.122, y: 2))
        path.addCurve(to: CGPoint(x: 22.251, y: 10.13),
            control1: CGPoint(x: 18.612, y: 2),
            control2: CGPoint(x: 22.251, y: 5.64))
        path.addCurve(to: CGPoint(x: 18.055, y: 17.24),
            control1: CGPoint(x: 22.251, y: 13.09),
            control2: CGPoint(x: 20.644, y: 15.83))
        path.addLine(to: CGPoint(x: 10.001, y: 21.7))
        path.addLine(to: CGPoint(x: 10.001, y: 18.01))
        path.addLine(to: CGPoint(x: 9.934, y: 18.01))
        path.addCurve(to: CGPoint(x: 1.751, y: 10),
            control1: CGPoint(x: 5.444, y: 18.11),
            control2: CGPoint(x: 1.751, y: 14.5))
        path.closeSubpath()
    }

    // MARK: - Repost (mesmo path outline e filled)
    static let repost = ActionIconShape(name: "ActionRepost") { path in
        path.move(to: CGPoint(x: 4.5, y: 3.88))
        path.addLine(to: CGPoint(x: 8.932, y: 8.02))
        path.addLine(to: CGPoint(x: 7.568, y: 9.48))
        path.addLine(to: CGPoint(x: 5.5, y: 7.55))
        path.addLine(to: CGPoint(x: 5.5, y: 16))
        path.addCurve(to: CGPoint(x: 7.5, y: 18),
            control1: CGPoint(x: 5.5, y: 17.1),
            control2: CGPoint(x: 6.396, y: 18))
        path.addLine(to: CGPoint(x: 13, y: 18))
        path.addLine(to: CGPoint(x: 13, y: 20))
        path.addLine(to: CGPoint(x: 7.5, y: 20))
        path.addCurve(to: CGPoint(x: 3.5, y: 16),
            control1: CGPoint(x: 5.291, y: 20),
            control2: CGPoint(x: 3.5, y: 18.21))
        path.addLine(to: CGPoint(x: 3.5, y: 7.55))
        path.addLine(to: CGPoint(x: 1.432, y: 9.48))
        path.addLine(to: CGPoint(x: 0.068, y: 8.02))
        path.addLine(to: CGPoint(x: 4.5, y: 3.88))
        path.closeSubpath()

        path.move(to: CGPoint(x: 16.5, y: 6))
        path.addLine(to: CGPoint(x: 11, y: 6))
        path.addLine(to: CGPoint(x: 11, y: 4))
        path.addLine(to: CGPoint(x: 16.5, y: 4))
        path.addCurve(to: CGPoint(x: 20.5, y: 8),
            control1: CGPoint(x: 18.709, y: 4),
            control2: CGPoint(x: 20.5, y: 5.79))
        path.addLine(to: CGPoint(x: 20.5, y: 16.45))
        path.addLine(to: CGPoint(x: 22.568, y: 14.52))
        path.addLine(to: CGPoint(x: 23.932, y: 15.98))
        path.addLine(to: CGPoint(x: 19.5, y: 20.12))
        path.addLine(to: CGPoint(x: 15.068, y: 15.98))
        path.addLine(to: CGPoint(x: 16.432, y: 14.52))
        path.addLine(to: CGPoint(x: 18.5, y: 16.45))
        path.addLine(to: CGPoint(x: 18.5, y: 8))
        path.addCurve(to: CGPoint(x: 16.5, y: 6),
            control1: CGPoint(x: 18.5, y: 6.9),
            control2: CGPoint(x: 17.604, y: 6))
        path.closeSubpath()
    }

    // MARK: - Heart Filled
    static let likeFilled = ActionIconShape(name: "ActionLikeFilled") { path in
        path.move(to: CGPoint(x: 20.884, y: 13.19))
        path.addCurve(to: CGPoint(x: 12.505, y: 20.86),
            control1: CGPoint(x: 16.883, y: 18.31),
            control2: CGPoint(x: 14.233, y: 15.67))
        path.addLine(to: CGPoint(x: 12.002, y: 21.16))
        path.addLine(to: CGPoint(x: 11.499, y: 20.86))
        path.addCurve(to: CGPoint(x: 3.118, y: 13.19),
            control1: CGPoint(x: 9.727, y: 15.67),
            control2: CGPoint(x: 7.077, y: 18.31))
        path.addCurve(to: CGPoint(x: 1.751, y: 10),
            control1: CGPoint(x: 2.428, y: 12.33),
            control2: CGPoint(x: 1.751, y: 11.17))
        path.addCurve(to: CGPoint(x: 6.352, y: 3.88),
            control1: CGPoint(x: 1.751, y: 6.0),
            control2: CGPoint(x: 3.861, y: 4.17))
        path.addCurve(to: CGPoint(x: 12.002, y: 5.89),
            control1: CGPoint(x: 8.515, y: 3.79),
            control2: CGPoint(x: 10.232, y: 4.44))
        path.addCurve(to: CGPoint(x: 17.652, y: 3.88),
            control1: CGPoint(x: 13.772, y: 4.44),
            control2: CGPoint(x: 15.489, y: 3.79))
        path.addCurve(to: CGPoint(x: 22.253, y: 6.89),
            control1: CGPoint(x: 20.143, y: 4.17),
            control2: CGPoint(x: 22.253, y: 6.0))
        path.addCurve(to: CGPoint(x: 20.884, y: 13.19),
            control1: CGPoint(x: 22.253, y: 8.37),
            control2: CGPoint(x: 22.203, y: 10.73))
        path.closeSubpath()
    }

    // MARK: - Views (Analytics)
    static let views = ActionIconShape(name: "ActionViews") { path in
        path.addRect(CGRect(x: 8.75, y: 3, width: 2, height: 18))
        path.addRect(CGRect(x: 18, y: 8, width: 2, height: 13))
        path.addRect(CGRect(x: 4.004, y: 11, width: 2, height: 10))
        path.addRect(CGRect(x: 13.248, y: 14, width: 2, height: 7))
    }

    // MARK: - Share
    static let share = ActionIconShape(name: "ActionShare") { path in
        path.move(to: CGPoint(x: 12, y: 2.59))
        path.addLine(to: CGPoint(x: 17.7, y: 8.29))
        path.addLine(to: CGPoint(x: 16.29, y: 9.71))
        path.addLine(to: CGPoint(x: 13, y: 6.41))
        path.addLine(to: CGPoint(x: 13, y: 16))
        path.addLine(to: CGPoint(x: 11, y: 16))
        path.addLine(to: CGPoint(x: 11, y: 6.41))
        path.addLine(to: CGPoint(x: 7.71, y: 9.71))
        path.addLine(to: CGPoint(x: 6.29, y: 8.29))
        path.closeSubpath()

        path.move(to: CGPoint(x: 21, y: 15))
        path.addLine(to: CGPoint(x: 20.98, y: 18.51))
        path.addCurve(to: CGPoint(x: 18.5, y: 21),
            control1: CGPoint(x: 20.98, y: 19.62),
            control2: CGPoint(x: 19.86, y: 21))
        path.addLine(to: CGPoint(x: 5.5, y: 21))
        path.addCurve(to: CGPoint(x: 3, y: 18.5),
            control1: CGPoint(x: 4.11, y: 21),
            control2: CGPoint(x: 3, y: 19.88))
        path.addLine(to: CGPoint(x: 3, y: 15))
        path.addLine(to: CGPoint(x: 5, y: 15))
        path.addLine(to: CGPoint(x: 5, y: 18.5))
        path.addCurve(to: CGPoint(x: 5.5, y: 19),
            control1: CGPoint(x: 5, y: 18.78),
            control2: CGPoint(x: 5.22, y: 19))
        path.addLine(to: CGPoint(x: 18.48, y: 19))
        path.addCurve(to: CGPoint(x: 18.98, y: 18.5),
            control1: CGPoint(x: 18.76, y: 19),
            control2: CGPoint(x: 18.98, y: 18.78))
        path.addLine(to: CGPoint(x: 19, y: 15))
        path.closeSubpath()
    }

    // MARK: - Bookmark Filled
    static let bookmarkFilled = ActionIconShape(name: "ActionBookmarkFilled") { path in
        path.move(to: CGPoint(x: 4, y: 4.5))
        path.addCurve(to: CGPoint(x: 6.5, y: 2),
            control1: CGPoint(x: 4, y: 3.12),
            control2: CGPoint(x: 5.119, y: 2))
        path.addLine(to: CGPoint(x: 17.5, y: 2))
        path.addCurve(to: CGPoint(x: 20, y: 4.5),
            control1: CGPoint(x: 18.881, y: 2),
            control2: CGPoint(x: 20, y: 3.12))
        path.addLine(to: CGPoint(x: 20, y: 22.94))
        path.addLine(to: CGPoint(x: 12, y: 17.23))
        path.addLine(to: CGPoint(x: 4, y: 22.94))
        path.closeSubpath()
    }
}

/// View SwiftUI que renderiza um ícone de ação.
struct ActionIconView: View {
    let shape: ActionIconShape
    var size: CGFloat = 18
    var color: Color = .secondary

    var body: some View {
        Canvas { context, _ in
            var path = Path()
            shape.buildPath(&path)
            context.fill(path, with: .color(color))
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}
