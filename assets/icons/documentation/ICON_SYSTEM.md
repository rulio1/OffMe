# OffMe Icon System Documentation

## Overview
This documentation describes the unified icon system for OffMe across Web, iOS, and Android platforms.

## Icon Organization Structure

```
assets/
  icons/
    shared/              # Shared icon definitions (JSON)
    web/                # Web platform icons
      navigation/       # Navigation icons
      action/           # Action icons
    ios/                # iOS platform icons
      navigation/       # Navigation icons
      action/           # Action icons
    android/            # Android platform icons
      navigation/       # Navigation icons
      action/           # Action icons
    documentation/      # Documentation files
```

## Icon Categories

### Navigation Icons
Primary navigation icons used in the application's main navigation:

- **home**: Home screen icon (outline, filled variants)
- **search**: Search functionality icon (outline variant)
- **notifications**: Notifications icon (outline, filled variants)
- **messages**: Direct messages icon (outline, filled variants)
- **bookmarks**: Bookmarks/saved items icon (outline, filled variants)
- **profile**: User profile icon (outline, filled variants)
- **more**: More options/overflow menu icon (filled variant)
- **lists**: Lists feature icon (outline, filled variants)
- **communities**: Communities feature icon (filled variant)
- **settings**: Settings icon (filled variant)
- **admin**: Admin/moderation icon (outline, filled variants)

### Action Icons
Action icons used for post interactions and other actions:

- **reply**: Reply to post icon (filled variant)
- **repost**: Repost/share icon (outline, filled variants)
- **like**: Like/favorite icon (outline, filled variants)
- **views**: View count icon (filled variant)
- **share**: Share post icon (filled variant)
- **bookmark**: Bookmark/save icon (outline, filled variants)
- **delete**: Delete post icon (filled variant)
- **more**: More post options icon (filled variant)
- **pin**: Pin post icon (filled variant)

## Icon Specification Format

The shared icon specification (`icon-spec.json`) uses the following format:

```json
{
  "version": "1.0.0",
  "categories": {
    "navigation": {
      "icons": {
        "icon_name": {
          "description": "Icon description",
          "variants": ["outline", "filled"],
          "design": {
            "viewport": [24, 24],
            "strokeWidth": { "outline": 1.75, "filled": null },
            "paths": {
              "outline": "SVG path data",
              "filled": "SVG path data"
            }
          }
        }
      }
    }
  }
}
```

## Platform Implementation Guidelines

### Web (React/TypeScript)
- Location: `frontend-web/src/components/icons/`
- Format: SVG components using React
- Usage: Import from generated components

### iOS (SwiftUI)
- Location: `mobile-ios/OffMe/Views/`
- Format: SwiftUI Path-based views
- Usage: Use generated SwiftUI components

### Android (Jetpack Compose)
- Location: `mobile-android/app/src/main/kotlin/com/offme/ui/components/`
- Format: Compose ImageVector components
- Usage: Use generated Compose functions

## Adding New Icons

1. **Add to Specification**: Add the new icon to `icon-spec.json` with all variants
2. **Generate Code**: Run the icon generator script
3. **Update Imports**: Update platform-specific imports as needed
4. **Test**: Verify the icon appears correctly on all platforms

## Icon Design Guidelines

- **Viewport**: All icons use 24x24 viewport
- **Stroke Width**: Outline icons use 1.75px stroke width
- **Consistency**: Maintain visual consistency across all platforms
- **Accessibility**: Ensure proper contrast and size for accessibility

## Migration from Old System

The new system replaces the previous approach where each platform had its own icon implementations:

- **Web**: Previously used inline SVG in `ActionIcons.tsx` and `XNavIcons.tsx`
- **iOS**: Previously used manual SwiftUI Path drawing in `XNavIcons.swift`
- **Android**: Previously used manual Compose PathBuilder in `XNavIcons.kt`

The new system provides:
- Centralized icon management
- Cross-platform consistency
- Easier maintenance and updates
- Better organization and discoverability