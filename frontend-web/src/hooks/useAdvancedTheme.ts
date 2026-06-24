/**
 * OffMe Design System - Advanced Theme System
 * Enhanced theme management with customization capabilities
 */
import { useState, useEffect } from 'react';
import { applyTheme } from '@/styles/design-system';

type Theme = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red';
type FontSize = 'small' | 'medium' | 'large';
type Spacing = 'compact' | 'normal' | 'spacious';

interface ThemePreferences {
  baseTheme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  spacing: Spacing;
  reducedMotion: boolean;
}

interface CustomThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

const DEFAULT_PREFERENCES: ThemePreferences = {
  baseTheme: 'system',
  accentColor: 'blue',
  fontSize: 'medium',
  spacing: 'normal',
  reducedMotion: false,
};

const ACCENT_COLORS: Record<AccentColor, string> = {
  blue: '#1d9bf0',
  purple: '#7c3aed',
  green: '#10b981',
  orange: '#f97316',
  pink: '#ec4899',
  red: '#ef4444',
};

export function useAdvancedTheme(): [
  ThemePreferences,
  (preferences: Partial<ThemePreferences>) => void,
  (colors: CustomThemeColors) => void
] {
  const [preferences, setPreferences] = useState<ThemePreferences>(DEFAULT_PREFERENCES);
  const [customColors, setCustomColors] = useState<CustomThemeColors | null>(null);

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedPreferences = localStorage.getItem('offme-theme-preferences');
    if (savedPreferences) {
      try {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(savedPreferences) });
      } catch (e) {
        console.error('Failed to parse theme preferences', e);
      }
    }

    // Load custom colors if available
    const savedColors = localStorage.getItem('offme-custom-colors');
    if (savedColors) {
      try {
        setCustomColors(JSON.parse(savedColors));
      } catch (e) {
        console.error('Failed to parse custom colors', e);
      }
    }
  }, []);

  useEffect(() => {
    // Save preferences to localStorage
    localStorage.setItem('offme-theme-preferences', JSON.stringify(preferences));

    // Apply theme based on preferences
    applyAdvancedTheme(preferences, customColors);

    // Apply reduced motion preference
    if (preferences.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // Apply font size preference
    document.documentElement.style.setProperty('--font-size-factor', getFontSizeFactor(preferences.fontSize));

    // Apply spacing preference
    document.documentElement.style.setProperty('--spacing-factor', getSpacingFactor(preferences.spacing));
  }, [preferences, customColors]);

  const updatePreferences = (newPreferences: Partial<ThemePreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  };

  const updateCustomColors = (colors: CustomThemeColors) => {
    setCustomColors(colors);
    localStorage.setItem('offme-custom-colors', JSON.stringify(colors));
  };

  return [preferences, updatePreferences, updateCustomColors];
}

function applyAdvancedTheme(preferences: ThemePreferences, customColors: CustomThemeColors | null) {
  const effectiveTheme = getEffectiveTheme(preferences.baseTheme);
  const colors = effectiveTheme === 'dark' ? getDarkThemeColors(preferences.accentColor, customColors) : getLightThemeColors(preferences.accentColor, customColors);

  // Apply base theme colors
  Object.entries(colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });

  // Apply accent color to CSS variables
  const accentColor = customColors?.accent || ACCENT_COLORS[preferences.accentColor];
  document.documentElement.style.setProperty('--color-offme-accent', accentColor);

  // Calculate hover color (darker version of accent)
  const accentHoverColor = shadeColor(accentColor, -10);
  document.documentElement.style.setProperty('--color-offme-accentHover', accentHoverColor);
}

function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function getLightThemeColors(accentColor: AccentColor, customColors: CustomThemeColors | null): Record<string, string> {
  const accent = customColors?.accent || ACCENT_COLORS[accentColor];

  return {
    '--color-offme-bg': customColors?.primary || '#ffffff',
    '--color-offme-surface': customColors?.secondary || '#f7f9fa',
    '--color-offme-border': '#e1e8ed',
    '--color-offme-text': '#0f1419',
    '--color-offme-muted': '#536471',
    '--color-offme-hover': 'rgba(0, 0, 0, 0.03)',
    '--color-offme-accent': accent,
    '--color-offme-accentHover': shadeColor(accent, -10),
    '--color-success': customColors?.success || '#00ba7c',
    '--color-warning': customColors?.warning || '#ffd400',
    '--color-danger': customColors?.danger || '#f91880',
    '--color-info': customColors?.info || '#1d9bf0',
  };
}

function getDarkThemeColors(accentColor: AccentColor, customColors: CustomThemeColors | null): Record<string, string> {
  const accent = customColors?.accent || ACCENT_COLORS[accentColor];

  return {
    '--color-offme-bg': customColors?.primary || '#000000',
    '--color-offme-surface': customColors?.secondary || '#16181c',
    '--color-offme-border': '#2f3336',
    '--color-offme-text': '#e7e9ea',
    '--color-offme-muted': '#71767b',
    '--color-offme-hover': 'rgba(255, 255, 255, 0.06)',
    '--color-offme-accent': accent,
    '--color-offme-accentHover': shadeColor(accent, -10),
    '--color-success': customColors?.success || '#00ba7c',
    '--color-warning': customColors?.warning || '#ffd400',
    '--color-danger': customColors?.danger || '#f91880',
    '--color-info': customColors?.info || '#1d9bf0',
  };
}

function getFontSizeFactor(fontSize: FontSize): string {
  const factors = {
    small: '0.9',
    medium: '1',
    large: '1.1',
  };
  return factors[fontSize];
}

function getSpacingFactor(spacing: Spacing): string {
  const factors = {
    compact: '0.9',
    normal: '1',
    spacious: '1.1',
  };
  return factors[spacing];
}

// Helper function to shade colors
function shadeColor(color: string, percent: number): string {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.round(R * (100 + percent) / 100);
  G = Math.round(G * (100 + percent) / 100);
  B = Math.round(B * (100 + percent) / 100);

  R = Math.min(255, Math.max(0, R));
  G = Math.min(255, Math.max(0, G));
  B = Math.min(255, Math.max(0, B));

  const RR = ((R << 16) | (G << 8) | B).toString(16).padStart(6, '0');
  return `#${RR}`;
}

// Theme provider component
export function AdvancedThemeProvider({ children }: { children: React.ReactNode }) {
  // This component can be used to wrap the app and provide theme context
  return <>{children}</>;
}

// Hook for theme preferences with system preference listener
export function useSystemThemeListener() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const preferences = localStorage.getItem('offme-theme-preferences');
      if (preferences) {
        try {
          const parsed = JSON.parse(preferences);
          if (parsed.baseTheme === 'system') {
            applyAdvancedTheme(parsed, null);
          }
        } catch (e) {
          console.error('Failed to handle system theme change', e);
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
}
