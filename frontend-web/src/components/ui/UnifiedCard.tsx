/**
 * OffMe Design System - Unified Card Component
 * Cross-platform card implementation for Web
 */
import React from 'react';
import { classNames } from '@/styles/design-system';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  isLoading?: boolean;
}

export const UnifiedCard = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      href,
      isLoading = false,
      children,
      ...props
    },
    ref
  ) => {
    // Size classes
    const sizeClasses = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    // Variant classes
    const variantClasses = {
      default: 'bg-offme-surface border border-transparent',
      elevated: 'bg-offme-surface border border-transparent shadow-md hover:shadow-lg',
      interactive: 'bg-offme-surface border border-transparent cursor-pointer hover:bg-offme-hover transition-colors',
      bordered: 'bg-offme-surface border border-offme-border',
    };

    const baseClasses = 'rounded-xl transition-all duration-200';
    const loadingClasses = isLoading ? 'animate-pulse opacity-60' : '';

    // Handle click behavior if href is provided
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (href) {
        e.preventDefault();
        window.location.href = href;
      }
    };

    return (
      <div
        ref={ref}
        className={classNames(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          loadingClasses,
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ) : (
          children
        )}
      </div>
    );
  }
);

UnifiedCard.displayName = 'UnifiedCard';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  isPill?: boolean;
}

export const UnifiedBadge: React.FC<BadgeProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  isPill = true,
  children,
  ...props
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-offme-accent text-white',
    secondary: 'bg-offme-surface border border-offme-border text-offme-text',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-black',
    danger: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    subtle: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  };

  const baseClasses = isPill
    ? 'inline-flex items-center rounded-full font-medium transition-all duration-200'
    : 'inline-flex items-center rounded-md font-medium transition-all duration-200';

  return (
    <span
      className={classNames(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

UnifiedBadge.displayName = 'UnifiedBadge';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const UnifiedInput = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      leadingIcon,
      trailingIcon,
      ...props
    },
    ref
  ) => {
    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-4 py-3 text-base',
    };

    // Variant classes
    const variantClasses = {
      default: 'border-offme-border focus:ring-offme-accent focus:border-transparent',
      error: 'border-red-500 focus:ring-red-500',
      success: 'border-green-500 focus:ring-green-500',
    };

    const baseClasses = 'w-full rounded-lg bg-offme-surface transition-all duration-200 focus:outline-none focus:ring-2';

    return (
      <div className="relative">
        {leadingIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {leadingIcon}
          </div>
        )}
        <input
          ref={ref}
          className={classNames(
            baseClasses,
            sizeClasses[size],
            variantClasses[variant],
            leadingIcon ? 'pl-10' : '',
            trailingIcon ? 'pr-10' : '',
            className
          )}
          {...props}
        />
        {trailingIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {trailingIcon}
          </div>
        )}
      </div>
    );
  }
);

UnifiedInput.displayName = 'UnifiedInput';