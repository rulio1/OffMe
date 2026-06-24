/**
 * OffMe Design System - Theme Customizer Component
 * UI for customizing theme preferences
 */
import React, { useState } from 'react';
import { useAdvancedTheme } from '@/hooks/useAdvancedTheme';
import { UnifiedButton, UnifiedCard, UnifiedBadge, UnifiedInput } from '@/components/ui';
import { classNames } from '@/styles/design-system';

const ACCENT_COLORS = [
  { name: 'Blue', value: 'blue', color: '#1d9bf0' },
  { name: 'Purple', value: 'purple', color: '#7c3aed' },
  { name: 'Green', value: 'green', color: '#10b981' },
  { name: 'Orange', value: 'orange', color: '#f97316' },
  { name: 'Pink', value: 'pink', color: '#ec4899' },
  { name: 'Red', value: 'red', color: '#ef4444' },
];

const FONT_SIZES = [
  { name: 'Small', value: 'small' },
  { name: 'Medium', value: 'medium' },
  { name: 'Large', value: 'large' },
];

const SPACING_OPTIONS = [
  { name: 'Compact', value: 'compact' },
  { name: 'Normal', value: 'normal' },
  { name: 'Spacious', value: 'spacious' },
];

export function ThemeCustomizer({ onClose }: { onClose: () => void }) {
  const [preferences, updatePreferences, updateCustomColors] = useAdvancedTheme();
  const [customColors, setCustomColors] = useState({
    primary: '#ffffff',
    secondary: '#f7f9fa',
    accent: '#1d9bf0',
    success: '#00ba7c',
    warning: '#ffd400',
    danger: '#f91880',
    info: '#1d9bf0',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomColors(customColors);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <UnifiedCard variant="elevated" size="lg" className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Customize Your Theme</h2>
          <UnifiedButton variant="ghost" size="sm" onClick={onClose}>
            Close
          </UnifiedButton>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Base Theme */}
          <div>
            <h3 className="font-semibold mb-3">Base Theme</h3>
            <div className="flex gap-2">
              {['light', 'dark', 'system'].map((theme) => (
                <UnifiedButton
                  key={theme}
                  variant={preferences.baseTheme === theme ? 'filled' : 'outline'}
                  size="sm"
                  onClick={() => updatePreferences({ baseTheme: theme as any })}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </UnifiedButton>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <h3 className="font-semibold mb-3">Accent Color</h3>
            <div className="flex gap-2 flex-wrap">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  className={classNames(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    preferences.accentColor === color.value ? 'ring-2 ring-offme-text' : 'hover:ring-2 ring-transparent',
                    color.value === 'blue' && 'border-blue-500',
                    color.value === 'purple' && 'border-purple-500',
                    color.value === 'green' && 'border-green-500',
                    color.value === 'orange' && 'border-orange-500',
                    color.value === 'pink' && 'border-pink-500',
                    color.value === 'red' && 'border-red-500'
                  )}
                  style={{ backgroundColor: color.color }}
                  onClick={() => updatePreferences({ accentColor: color.value as any })}
                  aria-label={`Select ${color.name} accent color`}
                />
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <h3 className="font-semibold mb-3">Font Size</h3>
            <div className="flex gap-2">
              {FONT_SIZES.map((size) => (
                <UnifiedButton
                  key={size.value}
                  variant={preferences.fontSize === size.value ? 'filled' : 'outline'}
                  size="sm"
                  onClick={() => updatePreferences({ fontSize: size.value as any })}
                >
                  {size.name}
                </UnifiedButton>
              ))}
            </div>
          </div>

          {/* Spacing */}
          <div>
            <h3 className="font-semibold mb-3">Spacing</h3>
            <div className="flex gap-2">
              {SPACING_OPTIONS.map((spacing) => (
                <UnifiedButton
                  key={spacing.value}
                  variant={preferences.spacing === spacing.value ? 'filled' : 'outline'}
                  size="sm"
                  onClick={() => updatePreferences({ spacing: spacing.value as any })}
                >
                  {spacing.name}
                </UnifiedButton>
              ))}
            </div>
          </div>

          {/* Reduced Motion */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.reducedMotion}
                onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
                className="rounded border-offme-border focus:ring-offme-accent"
              />
              <span>Reduce motion</span>
            </label>
          </div>
        </div>

        {/* Custom Colors */}
        <div className="mt-8 pt-6 border-t border-offme-border">
          <h3 className="font-semibold mb-4">Custom Colors</h3>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Primary Background</label>
                <UnifiedInput
                  type="color"
                  value={customColors.primary}
                  onChange={(e) => setCustomColors({...customColors, primary: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Secondary Background</label>
                <UnifiedInput
                  type="color"
                  value={customColors.secondary}
                  onChange={(e) => setCustomColors({...customColors, secondary: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Accent Color</label>
                <UnifiedInput
                  type="color"
                  value={customColors.accent}
                  onChange={(e) => setCustomColors({...customColors, accent: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Success Color</label>
                <UnifiedInput
                  type="color"
                  value={customColors.success}
                  onChange={(e) => setCustomColors({...customColors, success: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Warning Color</label>
                <UnifiedInput
                  type="color"
                  value={customColors.warning}
                  onChange={(e) => setCustomColors({...customColors, warning: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Danger Color</label>
                <UnifiedInput
                  type="color"
                  value={customColors.danger}
                  onChange={(e) => setCustomColors({...customColors, danger: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Info Color</label>
                <UnifiedInput
                  type="color"
                  value={customColors.info}
                  onChange={(e) => setCustomColors({...customColors, info: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-4">
              <UnifiedButton type="submit" variant="filled" size="md">
                Apply Custom Colors
              </UnifiedButton>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div className="mt-8 pt-6 border-t border-offme-border">
          <h3 className="font-semibold mb-4">Theme Preview</h3>
          <div className="flex gap-4 flex-wrap">
            <UnifiedButton variant="filled">Primary Button</UnifiedButton>
            <UnifiedButton variant="outline">Outline Button</UnifiedButton>
            <UnifiedBadge variant="primary">Badge</UnifiedBadge>
            <UnifiedBadge variant="success">Success</UnifiedBadge>
          </div>
        </div>
      </UnifiedCard>
    </div>
  );
}