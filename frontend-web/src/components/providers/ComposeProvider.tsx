'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { ComposeSheet } from '@/components/composer/ComposeSheet';
import { Composer } from '@/components/composer/Composer';
import type { Post } from '@/types';

interface ComposeOptions {
  quoteOfId?: number;
  quotedPost?: Post;
  onPostCreated?: () => void;
}

interface ComposeContextValue {
  openCompose: (options?: ComposeOptions) => void;
  closeCompose: () => void;
}

const ComposeContext = createContext<ComposeContextValue | null>(null);

export function useCompose() {
  const ctx = useContext(ComposeContext);
  if (!ctx) throw new Error('useCompose must be used within ComposeProvider');
  return ctx;
}

export function ComposeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ComposeOptions>({});

  const openCompose = useCallback((opts?: ComposeOptions) => {
    setOptions(opts ?? {});
    setOpen(true);
  }, []);

  const closeCompose = useCallback(() => {
    setOpen(false);
    setOptions({});
  }, []);

  const handlePostCreated = useCallback(() => {
    options.onPostCreated?.();
    closeCompose();
  }, [closeCompose, options]);

  return (
    <ComposeContext.Provider value={{ openCompose, closeCompose }}>
      {children}

      <ComposeSheet
        open={open}
        onClose={closeCompose}
        onPostCreated={handlePostCreated}
        quoteOfId={options.quoteOfId}
        quotedPost={options.quotedPost}
      />

      {open && (
        <div className="fixed inset-0 z-[60] hidden items-start justify-center bg-black/50 pt-[10vh] md:flex">
          <div className="mx-4 w-full max-w-[600px] overflow-hidden rounded-2xl border border-offme-border bg-offme-bg shadow-2xl">
            <div className="flex items-center justify-between border-b border-offme-border px-4 py-3">
              <button
                type="button"
                onClick={closeCompose}
                className="rounded-full p-2 text-offme-text transition-colors hover:bg-offme-hover"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
              <span className="font-bold">Novo post</span>
              <span className="w-9" />
            </div>
            <Composer
              quoteOfId={options.quoteOfId}
              quotedPost={options.quotedPost}
              onPostCreated={handlePostCreated}
            />
          </div>
        </div>
      )}
    </ComposeContext.Provider>
  );
}