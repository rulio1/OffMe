/**
 * OffMe Design System - Visual Foundation
 * Consistent design tokens for web, iOS, and Android
 */

// Spacing scale (rem-based for web, dp-based for mobile)
export const spacing = {
  none: 0,
  xxs: '0.25rem',  // 4px
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  xxl: '3rem',     // 48px
  xxxl: '4rem',    // 64px
};

// Border radius scale
export const radius = {
  none: '0',
  xs: '0.125rem',  // 2px
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  full: '9999px',  // Pill shape
  circle: '50%',
};

// Shadow levels
export const shadows = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
};

// Typography scale
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

// Animation timing
export const animation = {
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
  extraSlow: '500ms',
};

// Transition effects
export const transitions = {
  fast: `transition-all duration-[100ms] ease-in-out`,
  normal: `transition-all duration-[200ms] ease-in-out`,
  slow: `transition-all duration-[300ms] ease-in-out`,
};

// Button styles
export const buttons = {
  primary: {
    base: `inline-flex items-center justify-center rounded-lg font-semibold ${transitions.normal} focus:outline-none focus:ring-2 focus:ring-offset-2`,
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    },
    variant: {
      filled: 'bg-offme-accent text-white hover:bg-offme-accentHover',
      outline: 'border border-offme-border hover:bg-offme-hover',
      ghost: 'hover:bg-offme-hover',
      destructive: 'bg-red-500 text-white hover:bg-red-600',
    },
  },
  icon: {
    base: `inline-flex items-center justify-center rounded-full ${transitions.normal} focus:outline-none focus:ring-2 focus:ring-offset-2`,
    size: {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    },
    variant: {
      filled: 'bg-offme-accent text-white hover:bg-offme-accentHover',
      outline: 'border border-offme-border hover:bg-offme-hover',
      ghost: 'hover:bg-offme-hover',
    },
  },
};

// Card styles
export const cards = {
  base: `bg-offme-surface border border-offme-border rounded-xl ${shadows.sm} ${transitions.normal}`,
  hover: 'hover:shadow-md hover:border-offme-hover',
  interactive: 'cursor-pointer hover:bg-offme-hover',
};

// Avatar styles
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
};

// Input styles
export const inputs = {
  base: `w-full rounded-lg border border-offme-border bg-offme-surface ${transitions.normal} focus:outline-none focus:ring-2 focus:ring-offme-accent focus:border-transparent`,
  size: {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-base',
  },
};

// Badge styles
export const badges = {
  base: `inline-flex items-center rounded-full font-medium ${transitions.normal}`,
  size: {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  },
  variant: {
    primary: 'bg-offme-accent text-white',
    secondary: 'bg-offme-surface border border-offme-border',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-black',
    danger: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
  },
};

// Theme colors (CSS variables)
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
  },
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