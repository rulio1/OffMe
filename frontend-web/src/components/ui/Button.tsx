import React from 'react';
import { buttons, classNames } from '@/styles/design-system';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'filled',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  fullWidth = false,
  children,
  className,
  ...props
}: ButtonProps) {
  const baseStyle = buttons.primary.base;
  const sizeStyle = buttons.primary.size[size];
  const variantStyle = buttons.primary.variant[variant];

  const buttonClasses = classNames(
    baseStyle,
    sizeStyle,
    variantStyle,
    fullWidth ? 'w-full' : '',
    isLoading ? 'opacity-70 cursor-not-allowed' : '',
    className
  );

  return (
    <button className={buttonClasses} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          {children && <span className="ml-2">{children}</span>}
        </>
      ) : (
        <>
          {leftIcon && <span className={size === 'sm' ? 'mr-1' : 'mr-2'}>{leftIcon}</span>}
          {children}
          {rightIcon && <span className={size === 'sm' ? 'ml-1' : 'ml-2'}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  isLoading = false,
  children,
  className,
  ...props
}: IconButtonProps) {
  const baseStyle = buttons.icon.base;
  const sizeStyle = buttons.icon.size[size];
  const variantStyle = buttons.icon.variant[variant];

  const buttonClasses = classNames(
    baseStyle,
    sizeStyle,
    variantStyle,
    isLoading ? 'opacity-70 cursor-not-allowed' : '',
    className
  );

  return (
    <button className={buttonClasses} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        children
      )}
    </button>
  );
}