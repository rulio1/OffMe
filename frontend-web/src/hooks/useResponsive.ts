import { useState, useEffect } from 'react';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export function useResponsiveDesign(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('md');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width < 576) setBreakpoint('xs');
      else if (width >= 576 && width < 768) setBreakpoint('sm');
      else if (width >= 768 && width < 992) setBreakpoint('md');
      else if (width >= 992 && width < 1200) setBreakpoint('lg');
      else if (width >= 1200 && width < 1400) setBreakpoint('xl');
      else setBreakpoint('xxl');
    };

    // Initial call
    updateBreakpoint();

    // Add event listener
    window.addEventListener('resize', updateBreakpoint);

    // Cleanup
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const breakpoint = useResponsiveDesign();

  if (breakpoint === 'xs' || breakpoint === 'sm') return 'mobile';
  if (breakpoint === 'md') return 'tablet';
  return 'desktop';
}

/**
 * Responsive utilities
 */
export const responsive = {
  /**
   * Get responsive value based on breakpoint
   */
  getResponsiveValue: <T>(values: Record<Breakpoint, T>, currentBreakpoint: Breakpoint): T => {
    return values[currentBreakpoint];
  },

  /**
   * Responsive spacing utilities
   */
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },

  /**
   * Responsive typography
   */
  typography: {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    xxl: 'text-2xl',
  },

  /**
   * Generate responsive classes
   */
  generateResponsiveClasses: (baseClass: string, breakpoints: Partial<Record<Breakpoint, string>>): string => {
    let classes = baseClass;

    Object.entries(breakpoints).forEach(([bp, className]) => {
      classes += ` ${bp}:${className}`;
    });

    return classes.trim();
  },
};

/**
 * Responsive container component
 */
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full';
}

export function ResponsiveContainer({ children, className = '', maxWidth = 'xl' }: ResponsiveContainerProps) {
  const maxWidthClasses: Record<ResponsiveContainerProps['maxWidth'], string> = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    xxl: 'max-w-2xl',
    full: 'max-w-full',
  };

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClasses[maxWidth]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Hook for responsive navigation
 */
export function useResponsiveNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useDeviceType() === 'mobile';

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return {
    isMobile,
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
  };
}