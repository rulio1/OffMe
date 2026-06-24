import React from 'react';
import { inputs, classNames } from '@/styles/design-system';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  inputSize?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  inputSize = 'md',
  leftIcon,
  rightIcon,
  className,
  ...props
}: InputProps) {
  const baseClasses = inputs.base;
  const sizeClasses = inputs.size[inputSize];

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-offme-text">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          className={classNames(
            baseClasses,
            sizeClasses,
            leftIcon ? 'pl-10' : '',
            rightIcon ? 'pr-10' : '',
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      {(helperText || error) && (
        <p className={classNames(
          'text-sm',
          error ? 'text-red-500' : 'text-offme-muted'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rows?: number;
}

export function Textarea({
  label,
  error,
  helperText,
  rows = 4,
  className,
  ...props
}: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-offme-text">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={classNames(
          inputs.base,
          inputs.size.md,
          'resize-vertical',
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '',
          className
        )}
        {...props}
      />
      {(helperText || error) && (
        <p className={classNames(
          'text-sm',
          error ? 'text-red-500' : 'text-offme-muted'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}