'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Composer } from './Composer';
import type { Post } from '@/types';

interface ComposeSheetProps {
  open: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
  quoteOfId?: number;
  quotedPost?: Post;
}

export function ComposeSheet({
  open,
  onClose,
  onPostCreated,
  quoteOfId,
  quotedPost,
}: ComposeSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div className="absolute inset-x-0 bottom-0 top-12 flex flex-col rounded-t-2xl bg-offme-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-offme-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-offme-text transition-colors hover:bg-offme-hover"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Composer
            quoteOfId={quoteOfId}
            quotedPost={quotedPost}
            onPostCreated={() => {
              onPostCreated?.();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}