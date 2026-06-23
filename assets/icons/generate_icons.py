#!/usr/bin/env python3
"""
Icon Generator Script for OffMe
Generates platform-specific icon code from the unified icon specification.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional

class IconGenerator:
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

    def generate_all(self):
        """Generate icons for all platforms."""
        print("🚀 Starting icon generation...")

        # Create output directories
        self._create_directories()

        # Generate for each platform
        self._generate_web_icons()
        self._generate_ios_icons()
        self._generate_android_icons()

        print("✅ Icon generation completed successfully!")

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
            self.android_output_dir / 'action'
        ]

        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)

    def _generate_web_icons(self):
        """Generate React SVG components for web."""
        print("🌐 Generating Web icons...")

        # Generate navigation icons
        self._generate_web_category('navigation')

        # Generate action icons
        self._generate_web_category('action')

        # Generate index file
        self._generate_web_index()

    def _generate_web_category(self, category: str):
        """Generate web icons for a specific category."""
        category_data = self.spec['categories'][category]
        icons = category_data['icons']

        for icon_name, icon_data in icons.items():
            component_name = self._to_pascal_case(icon_name)
            file_path = self.web_output_dir / category / f"{component_name}.tsx"

            variants = icon_data['variants']
            design = icon_data['design']
            viewport = design['viewport']
            paths = design['paths']

            # Generate component content
            content = self._generate_web_component(
                component_name, icon_name, icon_data['description'],
                variants, viewport, paths
            )

            # Write to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

    def _generate_web_component(self, component_name: str, icon_name: str,
                             description: str, variants: List[str],
                             viewport: List[int], paths: Dict[str, str]) -> str:
        """Generate a React SVG component."""
        imports = "import clsx from 'clsx';\n"
        type_def = f"export type {component_name}Variant = '{' | '.join(variants)}';\n\n"
        interface = f"interface {component_name}Props {{\n  variant: {component_name}Variant;\n  className?: string;\n}}\n\n"

        component_doc = f"/**\n * {description}\n * Variants: {', '.join(variants)}\n */\n"
        component_sig = f"export function {component_name}({{ variant, className }}: {component_name}Props) {{\n"

        # Generate switch cases for variants
        cases = []
        for variant in variants:
            path_data = paths[variant]
            case_content = f"""    case '{variant}':
      return (
        <svg viewBox="0 0 {viewport[0]} {viewport[1]}" className={clsx('shrink-0', className)} aria-hidden>
          <path d="{path_data}" />
        </svg>
      );"""
            cases.append(case_content)

        switch_statement = "  switch (variant) {\n" + "\n\n".join(cases) + "\n  }\n"

        return imports + type_def + interface + component_doc + component_sig + switch_statement + "}\n"

    def _generate_web_index(self):
        """Generate index file for web icons."""
        index_path = self.web_output_dir / 'index.ts'
        content = """// Web Icon Exports
// Navigation Icons
export * from './navigation/HomeIcon';
export * from './navigation/SearchIcon';
export * from './navigation/NotificationsIcon';
export * from './navigation/MessagesIcon';
export * from './navigation/BookmarksIcon';
export * from './navigation/ProfileIcon';
export * from './navigation/MoreIcon';
export * from './navigation/ListsIcon';
export * from './navigation/CommunitiesIcon';
export * from './navigation/SettingsIcon';
export * from './navigation/AdminIcon';

// Action Icons
export * from './action/ReplyIcon';
export * from './action/RepostIcon';
export * from './action/LikeIcon';
export * from './action/ViewsIcon';
export * from './action/ShareIcon';
export * from './action/BookmarkIcon';
export * from './action/DeleteIcon';
export * from './action/MoreActionIcon';
export * from './action/PinIcon';
"""

        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)

    def _generate_ios_icons(self):
        """Generate SwiftUI code for iOS."""
        print("🍎 Generating iOS icons...")

        # Generate navigation icons
        self._generate_ios_category('navigation')

        # Generate action icons
        self._generate_ios_category('action')

    def _generate_ios_category(self, category: str):
        """Generate iOS icons for a specific category."""
        category_data = self.spec['categories'][category]
        icons = category_data['icons']

        # Create a single file for the category
        file_name = f"{category.capitalize()}Icons.swift"
        file_path = self.ios_output_dir / file_name

        content = self._generate_ios_file_header(category)

        # Add enum definition
        enum_values = [f"    case {icon_name}" for icon_name in icons.keys()]
        enum_content = "enum " + self._to_pascal_case(category) + "IconKind {\n" + "\n".join(enum_values) + "\n}\n\n"
        content += enum_content

        # Add struct definition
        content += self._generate_ios_struct_header(category)

        # Add body with switch statement
        content += "    var body: some View {\n"
        content += "        Group {\n"
        content += "            switch kind {\n"

        for icon_name, icon_data in icons.items():
            content += self._generate_ios_icon_case(icon_name, icon_data)

        content += "            }\n"
        content += "        }\n"
        content += self._generate_ios_modifiers()
        content += "    }\n\n"

        # Add path definitions
        for icon_name, icon_data in icons.items():
            content += self._generate_ios_paths(icon_name, icon_data)

        content += "}\n"

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

    def _generate_ios_file_header(self, category: str) -> str:
        """Generate file header for iOS."""
        return f"""// Generated by OffMe Icon Generator
// {category.capitalize()} Icons - SwiftUI Implementation

import SwiftUI

"""

    def _generate_ios_struct_header(self, category: str) -> str:
        """Generate struct header for iOS."""
        return f"""/// Modern and consistent {category} icons for iOS.
struct {self._to_pascal_case(category)}Icon: View {{
    let kind: {self._to_pascal_case(category)}IconKind
    var active = false

    private var strokeWidth: CGFloat {{ active ? 2.25 : 1.75 }}

"""

    def _generate_ios_icon_case(self, icon_name: str, icon_data: Dict[str, Any]) -> str:
        """Generate switch case for an iOS icon."""
        variants = icon_data['variants']
        pascal_name = self._to_pascal_case(icon_name)

        if len(variants) > 1 and 'filled' in variants:
            return f"""            case .{icon_name}:
                {pascal_name}Icon
"""
        else:
            return f"""            case .{icon_name}:
                strokedIcon({pascal_name}Path)
"""

    def _generate_ios_modifiers(self) -> str:
        """Generate view modifiers for iOS."""
        return """        .frame(width: 26, height: 26)
        .foregroundStyle(Color.primary.opacity(active ? 1 : 0.78))
        .scaleEffect(active ? 1.04 : 1)
        .animation(.easeOut(duration: 0.18), value: active)
"""

    def _generate_ios_paths(self, icon_name: str, icon_data: Dict[str, Any]) -> str:
        """Generate path definitions for iOS."""
        variants = icon_data['variants']
        design = icon_data['design']
        paths = design['paths']
        pascal_name = self._to_pascal_case(icon_name)

        content = ""

        if len(variants) > 1 and 'filled' in variants:
            # Generate filled and outline variants
            content += f"    @ViewBuilder\n"
            content += f"    private var {pascal_name}Icon: some View {{\n"
            content += f"        if active {{\n"
            content += f"            {pascal_name}FilledPath.fill(Color.primary)\n"
            content += f"        }} else {{\n"
            content += f"            {pascal_name}OutlinePath.stroke(\n"
            content += f"                Color.primary,\n"
            content += f"                style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round, lineJoin: .round)\n"
            content += f"            )\n"
            content += f"        }}\n"
            content += f"    }}\n\n"

            # Generate filled path
            content += f"    private var {pascal_name}FilledPath: Path {{\n"
            content += f"        var path = Path()\n"
            content += self._svg_path_to_swift(paths['filled'])
            content += f"        return path\n"
            content += f"    }}\n\n"

            # Generate outline path
            content += f"    private var {pascal_name}OutlinePath: Path {{\n"
            content += f"        var path = Path()\n"
            content += self._svg_path_to_swift(paths['outline'])
            content += f"        return path\n"
            content += f"    }}\n\n"
        else:
            # Generate single path
            variant = variants[0]
            content += f"    private var {pascal_name}Path: Path {{\n"
            content += f"        var path = Path()\n"
            content += self._svg_path_to_swift(paths[variant])
            content += f"        return path\n"
            content += f"    }}\n\n"

        return content

    def _svg_path_to_swift(self, svg_path: str) -> str:
        """Convert SVG path data to SwiftUI Path commands."""
        # This is a simplified conversion - in a real implementation,
        # you would parse the SVG path commands and convert them to SwiftUI equivalents
        return f"        // SVG Path: {svg_path}\n        // TODO: Implement proper SVG to SwiftUI path conversion\n        path.move(to: CGPoint(x: 12, y: 12))\n        path.addLine(to: CGPoint(x: 12, y: 12))\n"

    def _generate_android_icons(self):
        """Generate Jetpack Compose code for Android."""
        print("🤖 Generating Android icons...")

        # Generate navigation icons
        self._generate_android_category('navigation')

        # Generate action icons
        self._generate_android_category('action')

    def _generate_android_category(self, category: str):
        """Generate Android icons for a specific category."""
        category_data = self.spec['categories'][category]
        icons = category_data['icons']

        # Create a single file for the category
        file_name = f"{category.capitalize()}Icons.kt"
        file_path = self.android_output_dir / file_name

        content = self._generate_android_file_header(category)

        # Add enum definition
        enum_values = [f"    {icon_name.upper()}," for icon_name in icons.keys()]
        enum_content = "enum class " + self._to_pascal_case(category) + "IconKind {\n" + "\n".join(enum_values) + "\n}\n\n"
        content += enum_content

        # Add helper functions
        content += self._generate_android_helpers()

        # Add icon definitions
        for icon_name, icon_data in icons.items():
            content += self._generate_android_icon(icon_name, icon_data)

        # Add composable function
        content += self._generate_android_composable(category)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

    def _generate_android_file_header(self, category: str) -> str:
        """Generate file header for Android."""
        return f"""// Generated by OffMe Icon Generator
// {category.capitalize()} Icons - Jetpack Compose Implementation

package com.offme.ui.components

import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathBuilder
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

"""

    def _generate_android_helpers(self) -> str:
        """Generate helper functions for Android."""
        return """private fun strokePath(
    name: String,
    width: Float = 1.75f,
    block: PathBuilder.() -> Unit,
): ImageVector = ImageVector.Builder(
    name = name,
    defaultWidth = 24.dp,
    defaultHeight = 24.dp,
    viewportWidth = 24f,
    viewportHeight = 24f,
).apply {
    path(
        fill = SolidColor(Color.Transparent),
        stroke = SolidColor(Color.Black),
        strokeLineWidth = width,
        strokeLineCap = StrokeCap.Round,
        strokeLineJoin = StrokeJoin.Round,
        block = block,
    )
}.build()

private fun filledPath(
    name: String,
    block: PathBuilder.() -> Unit,
): ImageVector = ImageVector.Builder(
    name = name,
    defaultWidth = 24.dp,
    defaultHeight = 24.dp,
    viewportWidth = 24f,
    viewportHeight = 24f,
).apply {
    path(
        fill = SolidColor(Color.Black),
        block = block,
    )
}.build()

/** Desenha um círculo completo usando dois arcos (cx, cy, raio). */
private fun PathBuilder.circle(cx: Float, cy: Float, r: Float) {
    moveTo(cx + r, cy)
    arcTo(r, r, 0f, true, false, cx - r, cy)
    arcTo(r, r, 0f, true, false, cx + r, cy)
    close()
}

"""

    def _generate_android_icon(self, icon_name: str, icon_data: Dict[str, Any]) -> str:
        """Generate Android icon definition."""
        variants = icon_data['variants']
        design = icon_data['design']
        paths = design['paths']
        pascal_name = self._to_pascal_case(icon_name)

        content = ""

        if len(variants) > 1 and 'filled' in variants:
            # Generate filled and outline variants
            content += f"private val {pascal_name}Outline: ImageVector by lazy {{\n"
            content += f"    strokePath(\"{pascal_name}Outline\") {{\n"
            content += self._svg_path_to_compose(paths['outline'])
            content += f"    }}\n"
            content += f"}}\n\n"

            content += f"private val {pascal_name}Filled: ImageVector by lazy {{\n"
            content += f"    filledPath(\"{pascal_name}Filled\") {{\n"
            content += self._svg_path_to_compose(paths['filled'])
            content += f"    }}\n"
            content += f"}}\n\n"
        else:
            # Generate single variant
            variant = variants[0]
            if variant == 'filled':
                content += f"private val {pascal_name}: ImageVector by lazy {{\n"
                content += f"    filledPath(\"{pascal_name}\") {{\n"
                content += self._svg_path_to_compose(paths[variant])
                content += f"    }}\n"
                content += f"}}\n\n"
            else:
                content += f"private val {pascal_name}: ImageVector by lazy {{\n"
                content += f"    strokePath(\"{pascal_name}\") {{\n"
                content += self._svg_path_to_compose(paths[variant])
                content += f"    }}\n"
                content += f"}}\n\n"

        return content

    def _svg_path_to_compose(self, svg_path: str) -> str:
        """Convert SVG path data to Compose PathBuilder commands."""
        # This is a simplified conversion - in a real implementation,
        # you would parse the SVG path commands and convert them to Compose equivalents
        return f"    // SVG Path: {svg_path}\n    // TODO: Implement proper SVG to Compose path conversion\n    moveTo(12f, 12f)\n    lineTo(12f, 12f)\n"

    def _generate_android_composable(self, category: str) -> str:
        """Generate composable function for Android."""
        pascal_category = self._to_pascal_case(category)
        content = f"""@Composable
fun {pascal_category}Icon(
    kind: {pascal_category}IconKind,
    active: Boolean,
    tint: Color,
    modifier: Modifier = Modifier,
) {{
    val icon = when (kind) {{\n"""

        # This would be populated with actual icon mappings
        content += "        // TODO: Implement icon mapping\n"
        content += "    }}\n\n"
        content += "    Icon(\n"
        content += "        imageVector = icon,\n"
        content += "        contentDescription = null,\n"
        content += "        modifier = modifier.size(26.dp),\n"
        content += "        tint = tint.copy(alpha = if (active) 1f else 0.78f),\n"
        content += "    )\n"
        content += "}\n"

        return content

    def _to_pascal_case(self, text: str) -> str:
        """Convert text to PascalCase."""
        words = text.replace('-', ' ').replace('_', ' ').split()
        return ''.join(word.capitalize() for word in words)

    def _to_camel_case(self, text: str) -> str:
        """Convert text to camelCase."""
        pascal = self._to_pascal_case(text)
        return pascal[0].lower() + pascal[1:]

if __name__ == "__main__":
    generator = IconGenerator()
    generator.generate_all()