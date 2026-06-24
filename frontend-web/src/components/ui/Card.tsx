import React from 'react';
import { cards, classNames } from '@/styles/design-system';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  hoverable = false,
  interactive = false,
  padding = 'md',
  children,
  className,
  ...props
}: CardProps) {
  const baseClasses = classNames(
    cards.base,
    hoverable ? cards.hover : '',
    interactive ? cards.interactive : '',
    className
  );

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={classNames(baseClasses, paddingClasses[padding])} {...props}>
      {children}
    </div>
  );
}