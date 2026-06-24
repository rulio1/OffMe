import { useState, useEffect } from 'react';
import { applyTheme } from '@/styles/design-system';

type Theme = 'light' | 'dark' | 'system';

export function useTheme(defaultTheme: Theme = 'system'): [Theme, (theme: Theme) => void] {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('offme-theme') as Theme | null;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }

    // Apply initial theme
    applyTheme(getEffectiveTheme(savedTheme || defaultTheme));
  }, []);

  useEffect(() => {
    // Save theme preference
    localStorage.setItem('offme-theme', currentTheme);

    // Apply theme
    const effectiveTheme = getEffectiveTheme(currentTheme);
    applyTheme(effectiveTheme);

    // Add transition for smooth theme change
    document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';

    // Remove transition after theme is applied
    const timeout = setTimeout(() => {
      document.documentElement.style.transition = '';
    }, 300);

    return () => clearTimeout(timeout);
  }, [currentTheme]);

  return [currentTheme, setCurrentTheme];
}

function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return theme;
}

// Theme provider hook for easy access
export function useThemeToggle(): [Theme, () => void] {
  const [theme, setTheme] = useTheme();

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return [theme, toggleTheme];
}

// System theme preference listener
export function useSystemThemeListener() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const currentTheme = localStorage.getItem('offme-theme') as Theme | null;
      if (currentTheme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
}