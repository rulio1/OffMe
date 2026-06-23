import SwiftUI

enum XNavIconKind {
    case home
    case search
    case bookmarks
    case notifications
    case messages
    case profile
    case more
    case lists
    case communities
    case settings
    case admin
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
                notificationsIcon
            case .messages:
                messagesIcon
            case .profile:
                profileIcon
            case .more:
                strokedIcon(morePath)
            case .lists:
                listsIcon
            case .communities:
                communitiesIcon
            case .settings:
                strokedIcon(settingsPath)
            case .admin:
                adminIcon
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
            homeFilledPath.fill(OffMeTheme.text)
        } else {
            homeOutlinePath.stroke(
                OffMeTheme.text,
                style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round, lineJoin: .round)
            )
        }
    }

    @ViewBuilder
    private var bookmarksIcon: some View {
        if active {
            bookmarksPath.fill(OffMeTheme.text)
        } else {
            bookmarksPath.stroke(
                OffMeTheme.text,
                style: StrokeStyle(lineWidth: strokeWidth, lineJoin: .round)
            )
        }
    }

    @ViewBuilder
    private var notificationsIcon: some View {
        if active {
            notificationsFilledPath.fill(OffMeTheme.text)
        } else {
            strokedIcon(notificationsPath)
        }
    }

    @ViewBuilder
    private var messagesIcon: some View {
        if active {
            messagesFilledPath.fill(OffMeTheme.text)
        } else {
            strokedIcon(messagesPath)
        }
    }

    @ViewBuilder
    private var profileIcon: some View {
        if active {
            profileFilledPath.fill(OffMeTheme.text)
        } else {
            strokedIcon(profileOutlinePath)
        }
    }

    @ViewBuilder
    private var listsIcon: some View {
        if active {
            listsFilledPath.fill(OffMeTheme.text)
        } else {
            strokedIcon(listsOutlinePath)
        }
    }

    @ViewBuilder
    private var communitiesIcon: some View {
        communitiesFilledPath.fill(OffMeTheme.text.opacity(active ? 1 : 0.78))
    }

    @ViewBuilder
    private var adminIcon: some View {
        if active {
            adminFilledPath.fill(OffMeTheme.text)
        } else {
            adminOutlinePath.stroke(
                OffMeTheme.text,
                style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round, lineJoin: .round)
            )
        }
    }

    private func strokedIcon(_ path: Path) -> some View {
        path.stroke(
            OffMeTheme.text,
            style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round, lineJoin: .round)
        )
    }

    // MARK: - Paths

    /// Casa preenchida (ativo).
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

    /// Casa contornada (inativo).
    private var homeOutlinePath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 12, y: 2.25))
        path.addLine(to: CGPoint(x: 3.25, y: 7.65))
        path.addLine(to: CGPoint(x: 3.25, y: 19.25))
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

    /// Lupa — círculo + cabo.
    private var searchPath: Path {
        var path = Path()
        path.addEllipse(in: CGRect(x: 4, y: 4, width: 13, height: 13))
        path.move(to: CGPoint(x: 15.5, y: 15.5))
        path.addLine(to: CGPoint(x: 19.75, y: 19.75))
        return path
    }

    /// Bookmark.
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

    /// Sino de notificações (contorno).
    private var notificationsPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 12, y: 2.75))
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
        path.move(to: CGPoint(x: 9.5, y: 19))
        path.addCurve(
            to: CGPoint(x: 14.5, y: 19),
            control1: CGPoint(x: 9.5, y: 20.5),
            control2: CGPoint(x: 14.5, y: 20.5)
        )
        return path
    }

    /// Sino preenchido (ativo).
    private var notificationsFilledPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 19.5, y: 17))
        path.addLine(to: CGPoint(x: 19.5, y: 11))
        path.addCurve(
            to: CGPoint(x: 12, y: 3.5),
            control1: CGPoint(x: 19.5, y: 6.85),
            control2: CGPoint(x: 15.65, y: 3.5)
        )
        path.addCurve(
            to: CGPoint(x: 4.5, y: 11),
            control1: CGPoint(x: 8.35, y: 3.5),
            control2: CGPoint(x: 4.5, y: 6.85)
        )
        path.addLine(to: CGPoint(x: 4.5, y: 17))
        path.addLine(to: CGPoint(x: 2.5, y: 19.5))
        path.addLine(to: CGPoint(x: 2.5, y: 20))
        path.addLine(to: CGPoint(x: 21.5, y: 20))
        path.addLine(to: CGPoint(x: 21.5, y: 19.5))
        path.closeSubpath()
        path.move(to: CGPoint(x: 12, y: 22))
        path.addCurve(
            to: CGPoint(x: 14.5, y: 19.5),
            control1: CGPoint(x: 12, y: 23),
            control2: CGPoint(x: 14.5, y: 22)
        )
        path.addCurve(
            to: CGPoint(x: 12, y: 17),
            control1: CGPoint(x: 14.5, y: 17),
            control2: CGPoint(x: 12, y: 17)
        )
        path.addCurve(
            to: CGPoint(x: 9.5, y: 19.5),
            control1: CGPoint(x: 12, y: 17),
            control2: CGPoint(x: 9.5, y: 17)
        )
        path.addCurve(
            to: CGPoint(x: 12, y: 22),
            control1: CGPoint(x: 9.5, y: 22),
            control2: CGPoint(x: 12, y: 23)
        )
        return path
    }

    /// Envelope (contorno).
    private var messagesPath: Path {
        var path = Path()
        path.addRoundedRect(
            in: CGRect(x: 2.5, y: 5, width: 19, height: 14),
            cornerSize: CGSize(width: 2.5, height: 2.5)
        )
        path.move(to: CGPoint(x: 3.5, y: 6.5))
        path.addLine(to: CGPoint(x: 12, y: 13))
        path.addLine(to: CGPoint(x: 20.5, y: 6.5))
        return path
    }

    /// Envelope preenchido (ativo).
    private var messagesFilledPath: Path {
        var path = Path()
        path.addRoundedRect(
            in: CGRect(x: 2.5, y: 5, width: 19, height: 14),
            cornerSize: CGSize(width: 2.5, height: 2.5)
        )
        return path
    }

    /// Perfil (contorno).
    private var profileOutlinePath: Path {
        var path = Path()
        path.addEllipse(in: CGRect(x: 8, y: 4, width: 8, height: 8))
        path.move(to: CGPoint(x: 6, y: 20))
        path.addCurve(
            to: CGPoint(x: 18, y: 20),
            control1: CGPoint(x: 6, y: 15),
            control2: CGPoint(x: 7.5, y: 13.5)
        )
        path.addCurve(
            to: CGPoint(x: 6, y: 20),
            control1: CGPoint(x: 16.5, y: 13.5),
            control2: CGPoint(x: 18, y: 15)
        )
        return path
    }

    /// Perfil preenchido (ativo).
    private var profileFilledPath: Path {
        var path = Path()
        path.addEllipse(in: CGRect(x: 8, y: 3, width: 8, height: 8))
        path.move(to: CGPoint(x: 4.5, y: 21))
        path.addCurve(
            to: CGPoint(x: 19.5, y: 21),
            control1: CGPoint(x: 4.5, y: 14.5),
            control2: CGPoint(x: 8, y: 13)
        )
        path.addCurve(
            to: CGPoint(x: 4.5, y: 21),
            control1: CGPoint(x: 16, y: 13),
            control2: CGPoint(x: 19.5, y: 14.5)
        )
        path.closeSubpath()
        return path
    }

    /// "Mais" — 3 pontos horizontais.
    private var morePath: Path {
        var path = Path()
        path.addEllipse(in: CGRect(x: 6, y: 10.5, width: 3, height: 3))
        path.addEllipse(in: CGRect(x: 10.5, y: 10.5, width: 3, height: 3))
        path.addEllipse(in: CGRect(x: 15, y: 10.5, width: 3, height: 3))
        return path
    }

    /// Listas (contorno).
    private var listsOutlinePath: Path {
        var path = Path()
        path.addRoundedRect(
            in: CGRect(x: 7, y: 3, width: 12, height: 18),
            cornerSize: CGSize(width: 2, height: 2)
        )
        path.move(to: CGPoint(x: 10, y: 8))
        path.addLine(to: CGPoint(x: 16, y: 8))
        path.move(to: CGPoint(x: 10, y: 12))
        path.addLine(to: CGPoint(x: 16, y: 12))
        path.move(to: CGPoint(x: 10, y: 16))
        path.addLine(to: CGPoint(x: 16, y: 16))
        return path
    }

    /// Listas preenchidas (ativo).
    private var listsFilledPath: Path {
        var path = Path()
        path.addRoundedRect(
            in: CGRect(x: 7, y: 3, width: 12, height: 18),
            cornerSize: CGSize(width: 2, height: 2)
        )
        return path
    }

    /// Comunidades — 2 figuras sobrepostas.
    private var communitiesFilledPath: Path {
        var path = Path()
        path.addEllipse(in: CGRect(x: 9, y: 3, width: 6, height: 6))
        path.move(to: CGPoint(x: 6.5, y: 20))
        path.addCurve(
            to: CGPoint(x: 17.5, y: 20),
            control1: CGPoint(x: 6.5, y: 14),
            control2: CGPoint(x: 9, y: 12.5)
        )
        path.addCurve(
            to: CGPoint(x: 6.5, y: 20),
            control1: CGPoint(x: 15, y: 12.5),
            control2: CGPoint(x: 17.5, y: 14)
        )
        path.closeSubpath()
        path.addEllipse(in: CGRect(x: 14, y: 5, width: 5, height: 5))
        path.move(to: CGPoint(x: 13, y: 19))
        path.addCurve(
            to: CGPoint(x: 20, y: 19),
            control1: CGPoint(x: 13, y: 14.5),
            control2: CGPoint(x: 15, y: 13.5)
        )
        path.addCurve(
            to: CGPoint(x: 13, y: 19),
            control1: CGPoint(x: 18, y: 13.5),
            control2: CGPoint(x: 20, y: 14.5)
        )
        path.closeSubpath()
        return path
    }

    /// Escudo com check (admin/moderação) — contorno.
    private var adminOutlinePath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 12, y: 2))
        path.addLine(to: CGPoint(x: 4, y: 5))
        path.addLine(to: CGPoint(x: 4, y: 11))
        path.addCurve(
            to: CGPoint(x: 12, y: 22),
            control1: CGPoint(x: 4, y: 16.55),
            control2: CGPoint(x: 7.58, y: 21.74)
        )
        return path
    }

    /// Escudo com check (admin/moderação) — preenchido.
    private var adminFilledPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 12, y: 2))
        path.addLine(to: CGPoint(x: 4, y: 6))
        path.addLine(to: CGPoint(x: 4, y: 12))
        path.addCurve(
            to: CGPoint(x: 12, y: 23),
            control1: CGPoint(x: 4, y: 17.55),
            control2: CGPoint(x: 7.58, y: 22.74)
        )
        path.addCurve(
            to: CGPoint(x: 20, y: 12),
            control1: CGPoint(x: 16.42, y: 22.74),
            control2: CGPoint(x: 20, y: 17.55)
        )
        path.addLine(to: CGPoint(x: 20, y: 6))
        path.closeSubpath()
        // Check
        path.move(to: CGPoint(x: 10.5, y: 16.5))
        path.addLine(to: CGPoint(x: 7, y: 13))
        path.addLine(to: CGPoint(x: 8.41, y: 11.59))
        path.addLine(to: CGPoint(x: 10.5, y: 13.67))
        path.addLine(to: CGPoint(x: 15.59, y: 8.58))
        path.addLine(to: CGPoint(x: 17, y: 10))
        path.closeSubpath()
        return path
    }

    /// Engrenagem (configurações).
    private var settingsPath: Path {
        var path = Path()
        path.addEllipse(in: CGRect(x: 8.5, y: 8.5, width: 7, height: 7))
        for i in 0..<8 {
            let angle = Double(i) * 45.0
            let rad = angle * .pi / 180.0
            let x1 = 12 + 4.5 * cos(rad)
            let y1 = 12 + 4.5 * sin(rad)
            let x2 = 12 + 6.5 * cos(rad)
            let y2 = 12 + 6.5 * sin(rad)
            path.move(to: CGPoint(x: x1, y: y1))
            path.addLine(to: CGPoint(x: x2, y: y2))
        }
        return path
    }
}
