import React from 'react';
import { badges, classNames } from '@/styles/design-system';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({
  variant = 'secondary',
  size = 'sm',
  children,
  className,
  ...props
}: BadgeProps) {
  const baseClasses = badges.base;
  const sizeClasses = badges.size[size];
  const variantClasses = badges.variant[variant];

  return (
    <span className={classNames(baseClasses, sizeClasses, variantClasses, className)} {...props}>
      {children}
    </span>
  );
}