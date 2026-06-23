# OffMe Icons

This directory contains the unified icon system for OffMe across all platforms.

## Structure

```
assets/icons/
├── shared/              # Shared icon specifications
├── web/                 # Web platform icons
│   ├── navigation/      # Navigation icons
│   └── action/          # Action icons
├── ios/                 # iOS platform icons
│   ├── navigation/      # Navigation icons
│   └── action/          # Action icons
├── android/             # Android platform icons
│   ├── navigation/      # Navigation icons
│   └── action/          # Action icons
└── documentation/       # Icon system documentation
```

## Quick Start

1. **Add a new icon**: Edit `shared/icon-spec.json` and add your icon definition
2. **Generate code**: Run the icon generator script
3. **Use icons**: Import and use the generated components in your platform code

## Available Icons

### Navigation Icons (11 icons)
- Home, Search, Notifications, Messages, Bookmarks
- Profile, More, Lists, Communities, Settings, Admin

### Action Icons (10 icons)
- Reply, Repost, Like, Views, Share
- Bookmark, Delete, More, Pin

## Platform Integration

### Web (React)
```typescript
import { HomeIcon } from '@icons/web/navigation/HomeIcon';

function MyComponent() {
  return <HomeIcon variant="filled" className="w-6 h-6" />;
}
```

### iOS (SwiftUI)
```swift
import SwiftUI

struct MyView: View {
    var body: some View {
        NavigationIcon(kind: .home, active: true)
            .frame(width: 26, height: 26)
    }
}
```

### Android (Compose)
```kotlin
import androidx.compose.runtime.Composable
import com.offme.ui.components.NavigationIcon
import com.offme.ui.components.NavigationIconKind

@Composable
fun MyScreen() {
    NavigationIcon(
        kind = NavigationIconKind.Home,
        active = true,
        tint = Color.Black
    )
}
```

## Maintenance

- **Icon Specification**: `shared/icon-spec.json` - Central icon definitions
- **Documentation**: `documentation/` - Detailed documentation

## Support

For issues or questions about the icon system, please refer to the documentation or contact the development team.