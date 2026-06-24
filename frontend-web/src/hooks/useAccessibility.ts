import { useEffect, useRef } from 'react';

/**
 * Hook for managing focus and accessibility features
 */
export function useFocusManagement() {
  const focusRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);

  const setFocus = () => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  };

  return { focusRef, setFocus };
}

/**
 * Hook for keyboard navigation support
 */
export function useKeyboardNavigation(
  onEnter?: () => void,
  onSpace?: () => void,
  onEscape?: () => void
) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        onEnter?.();
        break;
      case ' ':
        e.preventDefault(); // Prevent page scroll on space
        onSpace?.();
        break;
      case 'Escape':
        onEscape?.();
        break;
      default:
        break;
    }
  };

  return { onKeyDown: handleKeyDown };
}

/**
 * Hook for screen reader announcements
 */
export function useScreenReaderAnnouncement() {
  const announcementRef = useRef<HTMLDivElement>(null);

  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
      announcementRef.current.setAttribute('aria-live', politeness);
    }
  };

  return { announcementRef, announce };
}

/**
 * Accessibility utilities
 */
export const accessibility = {
  /**
   * Get ARIA attributes for common UI patterns
   */
  getARIAAttributes: (
    role: 'button' | 'alert' | 'dialog' | 'menu' | 'tooltip' | 'status',
    additionalProps: Record<string, string> = {}
  ): Record<string, string> => {
    const baseAttributes: Record<string, string> = {
      role,
      ...additionalProps,
    };

    switch (role) {
      case 'button':
        return {
          ...baseAttributes,
          tabIndex: '0',
          'aria-disabled': additionalProps['aria-disabled'] || 'false',
        };
      case 'alert':
        return {
          ...baseAttributes,
          'aria-live': 'assertive',
          'aria-atomic': 'true',
        };
      case 'dialog':
        return {
          ...baseAttributes,
          'aria-modal': 'true',
          'aria-labelledby': additionalProps['aria-labelledby'] || '',
        };
      case 'menu':
        return {
          ...baseAttributes,
          'aria-orientation': 'vertical',
        };
      case 'tooltip':
        return {
          ...baseAttributes,
          'aria-live': 'polite',
        };
      case 'status':
        return {
          ...baseAttributes,
          'aria-live': 'polite',
          'aria-atomic': 'true',
        };
      default:
        return baseAttributes;
    }
  },

  /**
   * Check if color contrast meets WCAG standards
   */
  checkColorContrast: (foreground: string, background: string): boolean => {
    // Convert hex to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
          ]
        : [0, 0, 0];
    };

    const [r1, g1, b1] = hexToRgb(foreground);
    const [r2, g2, b2] = hexToRgb(background);

    // Calculate relative luminance
    const luminance = (r: number, g: number, b: number): number => {
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const l1 = luminance(r1, g1, b1);
    const l2 = luminance(r2, g2, b2);

    // Calculate contrast ratio
    const contrastRatio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    // WCAG AA requires at least 4.5:1 for normal text, 3:1 for large text
    return contrastRatio >= 4.5;
  },

  /**
   * Generate accessible label for components
   */
  generateAccessibleLabel: (baseLabel: string, additionalContext: string = ''): string => {
    return additionalContext ? `${baseLabel}. ${additionalContext}` : baseLabel;
  },
};