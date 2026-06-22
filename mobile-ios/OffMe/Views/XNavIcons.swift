import SwiftUI

enum XNavIconKind {
    case home
    case search
    case bookmarks
    case notifications
    case messages
}

/// Ícones estilo Twitter/X Side Navigation (Figma Community).
struct XNavIcon: View {
    let kind: XNavIconKind
    var active = false

    private var strokeWidth: CGFloat { active ? 2.1 : 1.75 }

    var body: some View {
        Group {
            switch kind {
            case .home:
                homeIcon
            case .search:
                strokedIcon(searchPath)
            case .bookmarks:
                bookmarksIcon
            case .notifications:
                strokedIcon(notificationsPath)
            case .messages:
                strokedIcon(messagesPath)
            }
        }
        .frame(width: 26, height: 26)
        .foregroundStyle(OffMeTheme.text.opacity(active ? 1 : 0.78))
        .scaleEffect(active ? 1.04 : 1)
        .animation(.easeOut(duration: 0.18), value: active)
    }

    @ViewBuilder
    private var homeIcon: some View {
        if active {
            homeFilledPath
                .fill(OffMeTheme.text)
        } else {
            homeOutlinePath
                .stroke(OffMeTheme.text, style: StrokeStyle(lineWidth: 1.75, lineJoin: .round))
        }
    }

    @ViewBuilder
    private var bookmarksIcon: some View {
        if active {
            bookmarksPath.fill(OffMeTheme.text)
        } else {
            bookmarksPath.stroke(OffMeTheme.text, style: StrokeStyle(lineWidth: 1.75, lineJoin: .round))
        }
    }

    private func strokedIcon(_ path: Path) -> some View {
        path.stroke(
            OffMeTheme.text,
            style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round, lineJoin: .round)
        )
    }

    private var homeFilledPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 21.591, y: 7.146))
        path.addLine(to: CGPoint(x: 12, y: 1.88))
        path.addLine(to: CGPoint(x: 2.409, y: 7.146))
        path.addLine(to: CGPoint(x: 2.409, y: 19.025))
        path.addLine(to: CGPoint(x: 8.89, y: 19.025))
        path.addLine(to: CGPoint(x: 8.89, y: 13.5))
        path.addLine(to: CGPoint(x: 14.716, y: 13.5))
        path.addLine(to: CGPoint(x: 14.716, y: 19.025))
        path.addLine(to: CGPoint(x: 21.197, y: 19.025))
        path.addLine(to: CGPoint(x: 21.197, y: 7.146))
        path.closeSubpath()
        return path
    }

    private var homeOutlinePath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 12, y: 2.25))
        path.addLine(to: CGPoint(x: 3.75, y: 7.5))
        path.addLine(to: CGPoint(x: 3.75, y: 20.25))
        path.addLine(to: CGPoint(x: 9, y: 20.25))
        path.addLine(to: CGPoint(x: 9, y: 13.5))
        path.addLine(to: CGPoint(x: 15, y: 13.5))
        path.addLine(to: CGPoint(x: 15, y: 20.25))
        path.addLine(to: CGPoint(x: 20.25, y: 20.25))
        path.addLine(to: CGPoint(x: 20.25, y: 7.5))
        path.closeSubpath()
        return path
    }

    private var searchPath: Path {
        var path = Path()
        path.addArc(
            center: CGPoint(x: 10.25, y: 10.25),
            radius: 6.5,
            startAngle: .degrees(0),
            endAngle: .degrees(360),
            clockwise: false
        )
        path.move(to: CGPoint(x: 16.25, y: 16.25))
        path.addLine(to: CGPoint(x: 20.25, y: 20.25))
        return path
    }

    private var bookmarksPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 5.5, y: 3))
        path.addLine(to: CGPoint(x: 18.5, y: 3))
        path.addQuadCurve(to: CGPoint(x: 20, y: 4.5), control: CGPoint(x: 20, y: 3))
        path.addLine(to: CGPoint(x: 20, y: 22))
        path.addLine(to: CGPoint(x: 12, y: 17.5))
        path.addLine(to: CGPoint(x: 4, y: 22))
        path.addLine(to: CGPoint(x: 4, y: 4.5))
        path.addQuadCurve(to: CGPoint(x: 5.5, y: 3), control: CGPoint(x: 4, y: 3))
        path.closeSubpath()
        return path
    }

    private var notificationsPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 12, y: 3.25))
        path.addCurve(
            to: CGPoint(x: 6.25, y: 9),
            control1: CGPoint(x: 8.83, y: 3.25),
            control2: CGPoint(x: 6.25, y: 5.83)
        )
        path.addLine(to: CGPoint(x: 6.25, y: 13.1))
        path.addLine(to: CGPoint(x: 4.85, y: 15.2))
        path.addLine(to: CGPoint(x: 19.15, y: 15.2))
        path.addLine(to: CGPoint(x: 17.75, y: 13.1))
        path.addLine(to: CGPoint(x: 17.75, y: 9))
        path.addCurve(
            to: CGPoint(x: 12, y: 3.25),
            control1: CGPoint(x: 17.75, y: 5.83),
            control2: CGPoint(x: 15.17, y: 3.25)
        )
        path.move(to: CGPoint(x: 9.25, y: 18.5))
        path.addCurve(
            to: CGPoint(x: 14.75, y: 18.5),
            control1: CGPoint(x: 9.25, y: 20.02),
            control2: CGPoint(x: 14.75, y: 20.02)
        )
        return path
    }

    private var messagesPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 4.5, y: 5.75))
        path.addLine(to: CGPoint(x: 19.5, y: 5.75))
        path.addQuadCurve(to: CGPoint(x: 20.75, y: 7), control: CGPoint(x: 20.75, y: 5.75))
        path.addLine(to: CGPoint(x: 20.75, y: 15.5))
        path.addQuadCurve(to: CGPoint(x: 19.5, y: 16.75), control: CGPoint(x: 20.75, y: 16.75))
        path.addLine(to: CGPoint(x: 9.2, y: 16.75))
        path.addLine(to: CGPoint(x: 5.25, y: 19.5))
        path.addLine(to: CGPoint(x: 5.25, y: 16.75))
        path.addLine(to: CGPoint(x: 4.5, y: 16.75))
        path.addQuadCurve(to: CGPoint(x: 3.25, y: 15.5), control: CGPoint(x: 3.25, y: 16.75))
        path.addLine(to: CGPoint(x: 3.25, y: 7))
        path.addQuadCurve(to: CGPoint(x: 4.5, y: 5.75), control: CGPoint(x: 3.25, y: 5.75))
        path.closeSubpath()
        return path
    }
}