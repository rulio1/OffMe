/**
 * OffMe Design System - Unified Button Component
 * Cross-platform button implementation for Web
 */
import React from 'react';
import { classNames } from '../../../frontend-web/src/styles/design-system';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outline' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isIconOnly?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button: React.ForwardRefRenderFunction<HTMLButtonElement, ButtonProps> = (
  {
    className,
    variant = 'filled',
    size = 'md',
    isLoading = false,
    isIconOnly = false,
    leadingIcon,
    trailingIcon,
    children,
    disabled,
    ...props
  },
  ref
) => {
  // Button size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Icon button size classes
  const iconSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  // Variant classes
  const variantClasses = {
    filled: 'bg-offme-accent text-white hover:bg-offme-accentHover active:bg-opacity-90',
    outline: 'border border-offme-border hover:bg-offme-hover active:border-offme-accent',
    ghost: 'hover:bg-offme-hover active:bg-offme-hover',
    destructive: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
    success: 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700',
  };

  const baseClasses = isIconOnly
    ? 'inline-flex items-center justify-center rounded-full'
    : 'inline-flex items-center justify-center rounded-lg font-semibold';

  const transitionClasses = 'transition-all duration-200 cubic-bezier(0.4, 0, 0.2, 1)';
  const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offme-accent';

  return (
    <button
      ref={ref}
      className={classNames(
        baseClasses,
        transitionClasses,
        focusClasses,
        isIconOnly ? iconSizeClasses[size] : sizeClasses[size],
        variantClasses[variant],
        (isLoading || disabled) && 'opacity-40 cursor-not-allowed',
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children && <span>{children}</span>}
        </div>
      ) : (
        <>
          {leadingIcon && <span className={isIconOnly ? '' : 'mr-2'}>{leadingIcon}</span>}
          {children}
          {trailingIcon && <span className={isIconOnly ? '' : 'ml-2'}>{trailingIcon}</span>}
        </>
      )}
    </button>
  );
};

Button.displayName = 'Button';

export const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  return (
    <Button ref={ref} isIconOnly {...props}>
      {props.children}
    </Button>
  );
});

IconButton.displayName = 'IconButton';
