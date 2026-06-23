#!/usr/bin/env python3
"""
Simple Icon Generator Script for OffMe
Creates organized icon structure without complex code generation.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, Any

class SimpleIconGenerator:
    def __init__(self, spec_path: str = 'assets/icons/shared/icon-spec.json'):
        self.spec_path = spec_path
        self.spec = self._load_specification()
        self.output_dir = Path('assets/icons')
        self.web_output_dir = self.output_dir / 'web'
        self.ios_output_dir = self.output_dir / 'ios'
        self.android_output_dir = self.output_dir / 'android'

    def _load_specification(self) -> Dict[str, Any]:
        """Load the icon specification JSON file."""
        try:
            with open(self.spec_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Error: Icon specification file not found at {self.spec_path}")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in specification file: {e}")
            sys.exit(1)

    def generate_organized_structure(self):
        """Generate organized icon structure."""
        print("🚀 Starting icon organization...")

        # Create output directories
        self._create_directories()

        # Create documentation
        self._create_documentation()

        # Create README
        self._create_readme()

        print("✅ Icon organization completed successfully!")

    def _create_directories(self):
        """Create necessary output directories."""
        directories = [
            self.web_output_dir,
            self.ios_output_dir,
            self.android_output_dir,
            self.web_output_dir / 'navigation',
            self.web_output_dir / 'action',
            self.ios_output_dir / 'navigation',
            self.ios_output_dir / 'action',
            self.android_output_dir / 'navigation',
            self.android_output_dir / 'action',
            self.output_dir / 'documentation'
        ]

        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"📁 Created directory: {directory}")

    def _create_documentation(self):
        """Create icon documentation."""
        doc_content = """# OffMe Icon System Documentation

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
"""

        doc_path = self.output_dir / 'documentation' / 'ICON_SYSTEM.md'
        with open(doc_path, 'w', encoding='utf-8') as f:
            f.write(doc_content)
        print(f"📄 Created documentation: {doc_path}")

    def _create_readme(self):
        """Create README for the icons directory."""
        readme_content = """# OffMe Icons

This directory contains the unified icon system for OffMe across all platforms.

## Structure

```
assets/icons/
├── shared/              # Shared icon specifications
├── web/                 # Generated web icon components
├── ios/                 # Generated iOS icon code
├── android/             # Generated Android icon code
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

- **Icon Generator**: `generate_icons.py` - Generates platform-specific code
- **Specification**: `shared/icon-spec.json` - Central icon definitions
- **Documentation**: `documentation/ICON_SYSTEM.md` - Detailed documentation

## Support

For issues or questions about the icon system, please refer to the documentation or contact the development team.
"""

        readme_path = self.output_dir / 'README.md'
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        print(f"📄 Created README: {readme_path")

    def _create_icon_inventory(self):
        """Create an inventory of all available icons."""
        inventory_content = """# OffMe Icon Inventory

## Navigation Icons

| Icon Name | Variants | Description |
|-----------|----------|-------------|
"""

        # Add navigation icons
        nav_icons = self.spec['categories']['navigation']['icons']
        for icon_name, icon_data in nav_icons.items():
            variants = ', '.join(icon_data['variants'])
            description = icon_data['description']
            inventory_content += f"| `{icon_name}` | {variants} | {description} |\n"

        inventory_content += "\n## Action Icons\n\n| Icon Name | Variants | Description |\n|-----------|----------|-------------|\n"

        # Add action icons
        action_icons = self.spec['categories']['action']['icons']
        for icon_name, icon_data in action_icons.items():
            variants = ', '.join(icon_data['variants'])
            description = icon_data['description']
            inventory_content += f"| `{icon_name}` | {variants} | {description} |\n"

        inventory_content += f"\n**Total Icons**: {len(nav_icons) + len(action_icons)} ({len(nav_icons)} navigation + {len(action_icons)} action)"

        inventory_path = self.output_dir / 'documentation' / 'ICON_INVENTORY.md'
        with open(inventory_path, 'w', encoding='utf-8') as f:
            f.write(inventory_content)
        print(f"📄 Created icon inventory: {inventory_path}")

if __name__ == "__main__":
    generator = SimpleIconGenerator()
    generator.generate_organized_structure()
    generator._create_icon_inventory()