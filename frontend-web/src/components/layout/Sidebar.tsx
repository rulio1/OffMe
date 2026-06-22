'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LogOut, PenLine } from 'lucide-react';
import clsx from 'clsx';
import { OffMeLogo } from '@/components/auth/OffMeLogo';
import { XNavIcon, type XNavIconName } from '@/components/icons/XNavIcons';
import { UserAvatar } from '@/components/user/UserAvatar';
import { useCompose } from '@/components/providers/ComposeProvider';
import { getStoredUser, clearSession } from '@/lib/auth';
import { logout } from '@/lib/api';

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: XNavIconName;
  match: (p: string) => boolean;
}[] = [
  { href: '/', label: 'Início', icon: 'home', match: (p) => p === '/' },
  { href: '/explore', label: 'Explorar', icon: 'search', match: (p) => p.startsWith('/explore') },
  { href: '/notifications', label: 'Notificações', icon: 'notifications', match: (p) => p.startsWith('/notifications') },
  { href: '/messages', label: 'Mensagens', icon: 'messages', match: (p) => p.startsWith('/messages') },
  { href: '/bookmarks', label: 'Salvos', icon: 'bookmarks', match: (p) => p.startsWith('/bookmarks') },
  { href: '/profile', label: 'Perfil', icon: 'profile', match: (p) => p.startsWith('/profile') },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openCompose } = useCompose();
  const user = getStoredUser();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    if (moreOpen) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [moreOpen]);

  const handleLogout = async () => {
    await logout();
    clearSession();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col px-2 md:flex xl:w-[275px] xl:px-3">
      <Link
        href="/"
        className="mb-2 mt-3 inline-flex rounded-full px-3 py-2 transition-colors hover:bg-black/5"
        aria-label="OffMe"
      >
        <OffMeLogo size="sm" />
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              title={label}
              className={clsx(
                'group flex items-center justify-center gap-5 rounded-full px-3 py-3 text-xl transition-colors hover:bg-black/5 xl:justify-start xl:px-4',
                active && 'font-bold'
              )}
            >
              <XNavIcon
                name={icon}
                active={active}
                className={clsx(
                  'h-7 w-7',
                  active ? 'scale-[1.04]' : 'group-hover:opacity-100'
                )}
              />
              <span className="hidden xl:inline">{label}</span>
            </Link>
          );
        })}

        <div ref={moreRef} className="relative">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className="group flex w-full items-center justify-center gap-5 rounded-full px-3 py-3 text-xl transition-colors hover:bg-black/5 xl:justify-start xl:px-4"
          >
            <XNavIcon name="more" className="h-7 w-7 group-hover:opacity-100" />
            <span className="hidden xl:inline">Mais</span>
          </button>

          {moreOpen && (
            <div
              role="menu"
              className="absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-2xl border border-offme-border bg-offme-bg py-2 shadow-lg xl:left-4"
            >
              <Link
                href="/bookmarks"
                role="menuitem"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-[15px] hover:bg-black/5"
              >
                <XNavIcon name="bookmarks" className="h-5 w-5" />
                Salvos
              </Link>
              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-[15px] hover:bg-black/5"
              >
                <XNavIcon name="profile" className="h-5 w-5" />
                Configurações do perfil
              </Link>
              <Link
                href="/settings/verification"
                role="menuitem"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-[15px] hover:bg-black/5"
              >
                <XNavIcon name="profile" className="h-5 w-5" />
                Verificação
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMoreOpen(false);
                  void handleLogout();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-red-500 hover:bg-red-500/10"
              >
                <LogOut className="h-5 w-5" />
                Sair
              </button>
            </div>
          )}
        </div>
      </nav>

      <button
        type="button"
        onClick={() => openCompose()}
        className="offme-btn-primary mt-4 flex h-12 w-12 items-center justify-center self-center p-0 xl:hidden"
        aria-label="Postar"
      >
        <PenLine className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => openCompose()}
        className="offme-btn-primary mt-4 hidden w-[90%] py-3 text-lg xl:block"
      >
        Postar
      </button>

      <Link
        href="/profile"
        className="mt-auto mb-4 flex items-center justify-center gap-3 rounded-full p-2 transition-colors hover:bg-black/5 xl:justify-start xl:p-3"
      >
        <UserAvatar url={user?.avatarUrl} size="md" />
        <div className="hidden min-w-0 flex-1 xl:block">
          <p className="truncate text-sm font-bold">{user?.displayName ?? 'Usuário'}</p>
          <p className="truncate text-sm text-offme-muted">@{user?.username ?? 'usuario'}</p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            void handleLogout();
          }}
          className="hidden rounded-full p-1.5 text-offme-muted transition-colors hover:bg-red-500/10 hover:text-red-400 xl:block"
          aria-label="Sair"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </Link>
    </aside>
  );
}