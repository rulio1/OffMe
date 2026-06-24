/**
 * OffMe Design System - Visual Foundation
 * Cross-platform design tokens implementation for Web
 * Based on shared design system tokens
 */

// Import shared design tokens (would be imported from design-system/tokens in real implementation)
// For now, we'll implement the web-specific version based on the shared tokens

// Spacing scale - aligned with cross-platform tokens
export const spacing = {
  none: '0',
  xxs: '4px',      // 0.25rem
  xs: '8px',       // 0.5rem
  sm: '12px',      // 0.75rem
  md: '16px',      // 1rem
  lg: '24px',      // 1.5rem
  xl: '32px',      // 2rem
  xxl: '48px',     // 3rem
  xxxl: '64px',    // 4rem
};

// Border radius scale - aligned with cross-platform tokens
export const radius = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
  circle: '50%',
};

// Shadow levels - aligned with cross-platform tokens
export const shadows = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
};

// Typography scale - enhanced with better responsive support
export const typography = {
  display: {
    large: 'font-bold text-3xl sm:text-4xl',
    medium: 'font-bold text-2xl sm:text-3xl',
    small: 'font-bold text-xl sm:text-2xl',
  },
  headline: {
    large: 'font-bold text-xl sm:text-2xl',
    medium: 'font-bold text-lg sm:text-xl',
    small: 'font-bold text-base sm:text-lg',
  },
  title: {
    large: 'font-semibold text-lg',
    medium: 'font-semibold text-base',
    small: 'font-semibold text-sm',
  },
  body: {
    large: 'text-base',
    medium: 'text-sm',
    small: 'text-xs',
  },
  label: {
    large: 'font-medium text-sm',
    medium: 'font-medium text-xs',
    small: 'font-medium text-xs uppercase tracking-wider',
  },
};

// Animation timing - aligned with cross-platform tokens
export const animation = {
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
  extraSlow: '500ms',
};

// Transition effects - enhanced with better easing functions
export const transitions = {
  fast: `transition-all duration-[100ms] cubic-bezier(0.4, 0, 0.2, 1)`,
  normal: `transition-all duration-[200ms] cubic-bezier(0.4, 0, 0.2, 1)`,
  slow: `transition-all duration-[300ms] cubic-bezier(0.4, 0, 0.2, 1)`,
};

// Button styles - enhanced with better accessibility and variants
export const buttons = {
  primary: {
    base: `inline-flex items-center justify-center rounded-lg font-semibold ${transitions.normal} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offme-accent`,
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    },
    variant: {
      filled: 'bg-offme-accent text-white hover:bg-offme-accentHover active:bg-opacity-90',
      outline: 'border border-offme-border hover:bg-offme-hover active:border-offme-accent',
      ghost: 'hover:bg-offme-hover active:bg-offme-hover',
      destructive: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
      success: 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700',
    },
    disabled: 'opacity-40 cursor-not-allowed',
  },
  icon: {
    base: `inline-flex items-center justify-center rounded-full ${transitions.normal} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offme-accent`,
    size: {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    },
    variant: {
      filled: 'bg-offme-accent text-white hover:bg-offme-accentHover active:bg-opacity-90',
      outline: 'border border-offme-border hover:bg-offme-hover active:border-offme-accent',
      ghost: 'hover:bg-offme-hover active:bg-offme-hover',
    },
    disabled: 'opacity-40 cursor-not-allowed',
  },
};

// Card styles - enhanced with better hover states
export const cards = {
  base: `bg-offme-surface border border-offme-border rounded-xl ${shadows.sm} ${transitions.normal}`,
  hover: 'hover:shadow-md hover:border-offme-accent',
  interactive: 'cursor-pointer hover:bg-offme-hover active:bg-offme-hover',
  elevated: 'shadow-lg',
};

// Avatar styles - enhanced with status indicators
export const avatars = {
  size: {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
    xxl: 'h-20 w-20',
  },
  base: 'rounded-full object-cover shrink-0',
  ring: 'ring-1 ring-offme-border',
  online: 'ring-2 ring-green-500',
  offline: 'ring-2 ring-gray-400',
  verified: 'ring-2 ring-blue-500',
};

// Input styles - enhanced with better focus states
export const inputs = {
  base: `w-full rounded-lg border border-offme-border bg-offme-surface ${transitions.normal} focus:outline-none focus:ring-2 focus:ring-offme-accent focus:border-transparent`,
  size: {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-base',
  },
  variant: {
    default: '',
    error: 'border-red-500 focus:ring-red-500',
    success: 'border-green-500 focus:ring-green-500',
  },
};

// Badge styles - enhanced with more variants
export const badges = {
  base: `inline-flex items-center rounded-full font-medium ${transitions.normal}`,
  size: {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  },
  variant: {
    primary: 'bg-offme-accent text-white',
    secondary: 'bg-offme-surface border border-offme-border',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-black',
    danger: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    subtle: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
};

// Theme colors (CSS variables) - aligned with cross-platform tokens
export const themeColors = {
  light: {
    '--color-offme-bg': '#ffffff',
    '--color-offme-surface': '#f7f9fa',
    '--color-offme-border': '#e1e8ed',
    '--color-offme-text': '#0f1419',
    '--color-offme-muted': '#536471',
    '--color-offme-hover': '#eff3f4',
    '--color-offme-accent': '#1d9bf0',
    '--color-offme-accentHover': '#1a8cd8',
    '--color-success': '#00ba7c',
    '--color-warning': '#ffd400',
    '--color-danger': '#f91880',
    '--color-info': '#1d9bf0',
  },
  dark: {
    '--color-offme-bg': '#000000',
    '--color-offme-surface': '#16181c',
    '--color-offme-border': '#2f3336',
    '--color-offme-text': '#e7e9ea',
    '--color-offme-muted': '#71767b',
    '--color-offme-hover': '#18191b',
    '--color-offme-accent': '#1d9bf0',
    '--color-offme-accentHover': '#1a8cd8',
    '--color-success': '#00ba7c',
    '--color-warning': '#ffd400',
    '--color-danger': '#f91880',
    '--color-info': '#1d9bf0',
  },
};

// New: Alert styles
export const alerts = {
  base: `p-4 rounded-lg border-l-4 ${transitions.normal}`,
  variant: {
    info: 'bg-blue-50 border-blue-500 text-blue-800',
    success: 'bg-green-50 border-green-500 text-green-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    danger: 'bg-red-50 border-red-500 text-red-800',
  },
};

// New: Tooltip styles
export const tooltips = {
  base: `absolute z-50 px-2 py-1 text-sm rounded-md bg-gray-800 text-white ${transitions.fast}`,
  arrow: 'absolute w-2 h-2 bg-gray-800 transform rotate-45',
};

// New: Skeleton loader styles
export const skeleton = {
  base: 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
  text: 'h-4 w-full mb-2',
  circle: 'rounded-full',
  rectangle: 'rounded-lg',
};

// Utility functions
export function applyTheme(theme: 'light' | 'dark') {
  const colors = theme === 'dark' ? themeColors.dark : themeColors.light;
  Object.entries(colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}