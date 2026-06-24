import React from 'react';

/**
 * Responsive container component
 */
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full';
}

export function ResponsiveContainer({ children, className = '', maxWidth = 'xl' }: ResponsiveContainerProps) {
  const maxWidthClasses: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full', string> = {
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