'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  dismissInstallBanner,
  shouldShowIosInstallBanner,
} from '@/lib/pwa';

const ROUTES_WITHOUT_MOBILE_NAV = new Set(['/login', '/signup', '/terms', '/privacy', '/about']);

export function InstallPwaBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const hasMobileNav = !ROUTES_WITHOUT_MOBILE_NAV.has(pathname);

  useEffect(() => {
    setVisible(shouldShowIosInstallBanner());
  }, []);

  if (!visible) return null;

  function handleDismiss() {
    dismissInstallBanner();
    setVisible(false);
  }

  return (
    <div
      className="fixed inset-x-0 z-40 border-t border-offme-border bg-offme-bg/98 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden"
      style={{
        bottom: hasMobileNav
          ? 'calc(52px + env(safe-area-inset-bottom, 0px))'
          : 'env(safe-area-inset-bottom, 0px)',
      }}
      role="region"
      aria-label="Instalar OffMe na tela de início"
    >
      <div className="mx-auto flex max-w-[600px] items-start gap-3">
        <img
          src="/apple-touch-icon.png"
          alt=""
          width={44}
          height={44}
          className="mt-0.5 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-offme-text">Instale o OffMe</p>
          <p className="mt-0.5 text-[13px] leading-snug text-offme-muted">
            Toque em{' '}
            <span className="inline-flex items-center gap-0.5 font-medium text-offme-text">
              <ShareIcon />
              Compartilhar
            </span>{' '}
            e depois em{' '}
            <span className="font-medium text-offme-text">Adicionar à Tela de Início</span> para
            receber notificações push no iPhone.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="-mr-1 shrink-0 rounded-full p-2 text-offme-muted transition-colors hover:bg-black/[0.05] hover:text-offme-text"
          aria-label="Fechar"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}