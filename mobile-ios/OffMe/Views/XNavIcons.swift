import SwiftUI

enum XNavIconKind {
    case home
    case search
    case bookmarks
    case notifications
    case messages
    case grok
}

/// Ícones modernos e consistentes para a navegação (iOS / Android / Web).
/// Design atual baseado nos ícones oficiais do X/Twitter (2024+).
struct XNavIcon: View {
    let kind: XNavIconKind
    var active = false

    private var strokeWidth: CGFloat { active ? 2.25 : 1.75 }

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
            case .grok:
                grokIcon
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
                .stroke(
                    OffMeTheme.text,
                    style: StrokeStyle(lineWidth: strokeWidth, lineJoin: .round, lineCap: .round)
                )
        }
    }

    @ViewBuilder
    private var bookmarksIcon: some View {
        bookmarksPath
            .if(active) { view in
                view.fill(OffMeTheme.text)
            }
            .if(!active) { view in
                view.stroke(
                    OffMeTheme.text,
                    style: StrokeStyle(lineWidth: strokeWidth, lineJoin: .round)
                )
            }
    }

    @ViewBuilder
    private var grokIcon: some View {
        if active {
            grokBigPath.fill(OffMeTheme.text)
            grokSmallPath.fill(OffMeTheme.text)
        } else {
            strokedIcon(grokBigPath)
                .overlay(strokedIcon(grokSmallPath))
        }
    }

    private func strokedIcon(_ path: Path) -> some View {
        path.stroke(
            OffMeTheme.text,
            style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round, lineJoin: .round)
        )
    }

    // MARK: - Paths

    /// Casa preenchida (ativo) — estilo X oficial.
    private var homeFilledPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 12, y: 1.696))
        path.addLine(to: CGPoint(x: 0.622, y: 8.807))
        path.addLine(to: CGPoint(x: 1.682, y: 10.503))
        path.addLine(to: CGPoint(x: 3, y: 9.679))
        path.addLine(to: CGPoint(x: 3, y: 19.5))
        path.addCurve(
            to: CGPoint(x: 5.5, y: 22),
            control1: CGPoint(x: 3, y: 20.881),
            control2: CGPoint(x: 4.119, y: 22)
        )
        path.addLine(to: CGPoint(x: 18.5, y: 22))
        path.addCurve(
            to: CGPoint(x: 21, y: 19.5),
            control1: CGPoint(x: 19.881, y: 22),
            control2: CGPoint(x: 21, y: 20.881)
        )
        path.addLine(to: CGPoint(x: 21, y: 9.679))
        path.addLine(to: CGPoint(x: 22.318, y: 10.503))
        path.addLine(to: CGPoint(x: 23.378, y: 8.807))
        path.addLine(to: CGPoint(x: 12, y: 1.696))
        path.closeSubpath()
        return path
    }

    /// Casa contornada (inativo) — base levemente arredondada.
    private var homeOutlinePath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 12, y: 2.25))
        path.addLine(to: CGPoint(x: 3.25, y: 7.65))
        path.addLine(to: CGPoint(x: 3.25, y: 19.25))
        // left wall rounded
        path.addArc(
            center: CGPoint(x: 3.75, y: 19.75),
            radius: 0.5,
            startAngle: .degrees(180),
            endAngle: .degrees(90),
            clockwise: true
        )
        path.addLine(to: CGPoint(x: 9.2, y: 20.25))
        path.addLine(to: CGPoint(x: 9.2, y: 13.5))
        path.addLine(to: CGPoint(x: 14.8, y: 13.5))
        path.addLine(to: CGPoint(x: 14.8, y: 20.25))
        path.addLine(to: CGPoint(x: 20.25, y: 20.25))
        path.addArc(
            center: CGPoint(x: 20.75, y: 19.75),
            radius: 0.5,
            startAngle: .degrees(90),
            endAngle: .degrees(0),
            clockwise: true
        )
        path.addLine(to: CGPoint(x: 20.75, y: 7.65))
        path.addLine(to: CGPoint(x: 12, y: 2.25))
        path.closeSubpath()
        return path
    }

    /// Lupa — círculo + cabo reto arredondado.
    private var searchPath: Path {
        var path = Path()
        path.addEllipse(in: CGRect(x: 4, y: 4, width: 13, height: 13))
        path.move(to: CGPoint(x: 15.5, y: 15.5))
        path.addLine(to: CGPoint(x: 19.75, y: 19.75))
        return path
    }

    /// Bookmark — mesma forma para contorno e preenchimento.
    private var bookmarksPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 4, y: 4.5))
        path.addArc(
            center: CGPoint(x: 6.5, y: 4.5),
            radius: 2.5,
            startAngle: .degrees(180),
            endAngle: .degrees(0),
            clockwise: false
        )
        // top-right rounded corner
        path.addArc(
            center: CGPoint(x: 17.5, y: 4.5),
            radius: 2.5,
            startAngle: .degrees(180),
            endAngle: .degrees(0),
            clockwise: false
        )
        path.addLine(to: CGPoint(x: 20, y: 21.65))
        path.addLine(to: CGPoint(x: 12, y: 16.05))
        path.addLine(to: CGPoint(x: 4, y: 21.65))
        path.addLine(to: CGPoint(x: 4, y: 4.5))
        path.closeSubpath()
        return path
    }

    /// Sino de notificações.
    private var notificationsPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 12, y: 2.75))
        // bell dome
        path.addCurve(
            to: CGPoint(x: 5.75, y: 9),
            control1: CGPoint(x: 8.55, y: 2.75),
            control2: CGPoint(x: 5.75, y: 5.55)
        )
        path.addLine(to: CGPoint(x: 5.75, y: 12.1))
        path.addLine(to: CGPoint(x: 4.25, y: 14.7))
        path.addArc(
            center: CGPoint(x: 4.9, y: 15.825),
            radius: 0.75,
            startAngle: .degrees(-60),
            endAngle: .degrees(0),
            clockwise: false
        )
        path.addLine(to: CGPoint(x: 19.1, y: 15.825))
        path.addArc(
            center: CGPoint(x: 19.75, y: 15.825),
            radius: 0.75,
            startAngle: .degrees(180),
            endAngle: .degrees(120),
            clockwise: true
        )
        path.addLine(to: CGPoint(x: 18.25, y: 12.1))
        path.addLine(to: CGPoint(x: 18.25, y: 9))
        path.addCurve(
            to: CGPoint(x: 12, y: 2.75),
            control1: CGPoint(x: 18.25, y: 5.55),
            control2: CGPoint(x: 15.45, y: 2.75)
        )
        // clapper
        path.move(to: CGPoint(x: 9.5, y: 19))
        path.addCurve(
            to: CGPoint(x: 14.5, y: 19),
            control1: CGPoint(x: 9.5, y: 20.5),
            control2: CGPoint(x: 14.5, y: 20.5)
        )
        return path
    }

    /// Balão de mensagem (tail à esquerda).
    private var messagesPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 5.25, y: 5))
        path.addLine(to: CGPoint(x: 18.75, y: 5))
        path.addArc(
            center: CGPoint(x: 18.75, y: 7.25),
            radius: 2.25,
            startAngle: .degrees(-90),
            endAngle: .degrees(0),
            clockwise: false
        )
        path.addLine(to: CGPoint(x: 21, y: 15.75))
        path.addArc(
            center: CGPoint(x: 18.75, y: 18),
            radius: 2.25,
            startAngle: .degrees(0),
            endAngle: .degrees(90),
            clockwise: false
        )
        path.addLine(to: CGPoint(x: 8.5, y: 18))
        path.addLine(to: CGPoint(x: 4.65, y: 21.02))
        path.addArc(
            center: CGPoint(x: 3.5, y: 20.43),
            radius: 0.75,
            startAngle: .degrees(45),
            endAngle: .degrees(180),
            clockwise: true
        )
        path.addLine(to: CGPoint(x: 3.5, y: 18))
        path.addLine(to: CGPoint(x: 3.25, y: 18))
        path.addArc(
            center: CGPoint(x: 3.25, y: 15.75),
            radius: 2.25,
            startAngle: .degrees(90),
            endAngle: .degrees(180),
            clockwise: false
        )
        path.addLine(to: CGPoint(x: 3, y: 7.25))
        path.addArc(
            center: CGPoint(x: 5.25, y: 5),
            radius: 2.25,
            startAngle: .degrees(180),
            endAngle: .degrees(-90),
            clockwise: false
        )
        path.closeSubpath()
        return path
    }

    /// Sparkle grande (Grok) — estrela de 4 pontas.
    private var grokBigPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 12, y: 2))
        path.addLine(to: CGPoint(x: 13.8, y: 7.2))
        path.addCurve(
            to: CGPoint(x: 16.8, y: 10.2),
            control1: CGPoint(x: 14.2, y: 7.8),
            control2: CGPoint(x: 16.2, y: 9.8)
        )
        path.addLine(to: CGPoint(x: 21.4, y: 11))
        path.addLine(to: CGPoint(x: 16.2, y: 12.4))
        path.addCurve(
            to: CGPoint(x: 13.2, y: 15.4),
            control1: CGPoint(x: 16.0, y: 12.6),
            control2: CGPoint(x: 14.0, y: 14.6)
        )
        path.addLine(to: CGPoint(x: 12, y: 20))
        path.addLine(to: CGPoint(x: 10.2, y: 14.8))
        path.addCurve(
            to: CGPoint(x: 7.2, y: 11.8),
            control1: CGPoint(x: 9.8, y: 14.2),
            control2: CGPoint(x: 7.8, y: 12.2)
        )
        path.addLine(to: CGPoint(x: 2.6, y: 11))
        path.addLine(to: CGPoint(x: 7.8, y: 9.6))
        path.addCurve(
            to: CGPoint(x: 10.8, y: 6.6),
            control1: CGPoint(x: 8.0, y: 9.4),
            control2: CGPoint(x: 10.0, y: 7.4)
        )
        path.addLine(to: CGPoint(x: 12, y: 2))
        path.closeSubpath()
        return path
    }

    /// Sparkle pequeno (Grok) — estrela de 4 pontas menor.
    private var grokSmallPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 19, y: 13.5))
        path.addLine(to: CGPoint(x: 19.8, y: 15.7))
        path.addCurve(
            to: CGPoint(x: 22, y: 16.5),
            control1: CGPoint(x: 20.2, y: 15.9),
            control2: CGPoint(x: 21.6, y: 16.3)
        )
        path.addLine(to: CGPoint(x: 19.8, y: 17.3))
        path.addCurve(
            to: CGPoint(x: 19, y: 19.5),
            control1: CGPoint(x: 19.4, y: 17.7),
            control2: CGPoint(x: 19.0, y: 18.9)
        )
        path.addLine(to: CGPoint(x: 18.2, y: 17.3))
        path.addCurve(
            to: CGPoint(x: 16, y: 16.5),
            control1: CGPoint(x: 17.8, y: 17.1),
            control2: CGPoint(x: 16.4, y: 16.7)
        )
        path.addLine(to: CGPoint(x: 18.2, y: 15.7))
        path.addCurve(
            to: CGPoint(x: 19, y: 13.5),
            control1: CGPoint(x: 18.6, y: 15.3),
            control2: CGPoint(x: 19.0, y: 14.1)
        )
        path.closeSubpath()
        return path
    }
}

// Helper para aplicar modificadores condicionalmente.
private extension View {
    @ViewBuilder
    func `if`<Transform: View>(_ condition: Bool, transform: (Self) -> Transform) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}