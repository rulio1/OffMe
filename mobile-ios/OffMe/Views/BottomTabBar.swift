import SwiftUI

struct BottomTabItem: Identifiable {
    let id: Int
    let icon: XNavIconKind
    let label: String
}

struct BottomTabBar: View {
    @Binding var selectedTab: Int
    var unreadCount: Int = 0

    private let items: [BottomTabItem] = [
        BottomTabItem(id: 0, icon: .home, label: "Início"),
        BottomTabItem(id: 1, icon: .search, label: "Explorar"),
        BottomTabItem(id: 2, icon: .grok, label: "Grok"),
        BottomTabItem(id: 3, icon: .notifications, label: "Notificações"),
        BottomTabItem(id: 4, icon: .messages, label: "Mensagens"),
    ]

    var body: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(OffMeTheme.border.opacity(0.9))
                .frame(height: 0.5)

            HStack(spacing: 0) {
                ForEach(items) { item in
                    tabButton(item)
                }
            }
            .frame(height: 52)
            .padding(.horizontal, 4)
        }
        .background {
            Rectangle()
                .fill(.ultraThinMaterial)
                .background(OffMeTheme.bg.opacity(0.92))
                .ignoresSafeArea(edges: .bottom)
        }
    }

    @ViewBuilder
    private func tabButton(_ item: BottomTabItem) -> some View {
        let isSelected = selectedTab == item.id

        Button {
            withAnimation(.easeOut(duration: 0.18)) {
                selectedTab = item.id
            }
        } label: {
            ZStack(alignment: .topTrailing) {
                XNavIcon(kind: item.icon, active: isSelected)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                if item.id == 3, unreadCount > 0 {
                    Circle()
                        .fill(OffMeTheme.accent)
                        .frame(width: 8, height: 8)
                        .offset(x: 6, y: 8)
                }
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(item.label)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}