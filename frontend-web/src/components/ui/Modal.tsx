import React from 'react';
import { Button } from './Button';
import { classNames, transitions } from '@/styles/design-system';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Modal container */}
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div className={classNames(
          "inline-block align-bottom bg-offme-surface border border-offme-border rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle",
          sizeClasses[size],
          transitions.normal
        )}>
          <div className="bg-offme-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {title && (
                <div className="flex-1">
                  <h3 className="text-lg leading-6 font-medium text-offme-text" id="modal-title">
                    {title}
                  </h3>
                </div>
              )}
              <div className="mt-3 sm:mt-0 sm:ml-4 sm:flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full text-offme-muted hover:text-offme-text focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offme-accent"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="mt-4">
              {children}
            </div>
          </div>
          {footer && (
            <div className="bg-offme-surface px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-offme-border">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'filled' | 'outline' | 'destructive';
}

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'destructive',
}: AlertDialogProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="mt-2">
        <p className="text-sm text-offme-muted">
          {message}
        </p>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
        <Button onClick={onConfirm} variant={confirmVariant} size="sm">
          {confirmText}
        </Button>
        <Button onClick={onClose} variant="outline" size="sm">
          {cancelText}
        </Button>
      </div>
    </Modal>
  );
}

