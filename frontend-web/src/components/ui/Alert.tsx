import React from 'react';
import { alerts, classNames } from '@/styles/design-system';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  const alertClasses = classNames(
    alerts.base,
    alerts.variant[variant],
    className
  );

  return (
    <div className={alertClasses} role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          {/* Icon placeholder - would use actual icons in real implementation */}
          <div className="h-5 w-5">
            {variant === 'info' && <span>ℹ️</span>}
            {variant === 'success' && <span>✅</span>}
            {variant === 'warning' && <span>⚠️</span>}
            {variant === 'danger' && <span>❌</span>}
          </div>
        </div>
        <div className="ml-3">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <div className="mt-2 text-sm">{children}</div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className="inline-flex rounded-md p-1.5 hover:bg-offme-hover focus:outline-none focus:ring-2 focus:ring-offme-accent"
                onClick={onDismiss}
              >
                <span className="sr-only">Dismiss</span>
                {/* Close icon placeholder */}
                <span>✕</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}