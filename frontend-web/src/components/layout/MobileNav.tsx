'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { XNavIcon, type XNavIconName } from '@/components/icons/XNavIcons';

type NavItem = {
  href: string;
  label: string;
  icon: XNavIconName;
  match: (pathname: string) => boolean;
};

const ITEMS: NavItem[] = [
  { href: '/', label: 'Início', icon: 'home', match: (p) => p === '/' },
  { href: '/explore', label: 'Explorar', icon: 'search', match: (p) => p.startsWith('/explore') },
  { href: '/notifications', label: 'Notificações', icon: 'notifications', match: (p) => p.startsWith('/notifications') },
  { href: '/messages', label: 'Mensagens', icon: 'messages', match: (p) => p.startsWith('/messages') },
  { href: '/profile', label: 'Perfil', icon: 'profile', match: (p) => p.startsWith('/profile') },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mobile-nav fixed inset-x-0 bottom-0 z-50 border-t border-offme-border/90 bg-offme-bg/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex h-[52px] max-w-[600px] items-stretch justify-between px-2">
        {ITEMS.map(({ href, label, icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={label}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className="mobile-nav-item group flex flex-1 items-center justify-center"
            >
              <XNavIcon
                name={icon}
                active={active}
                className={clsx(
                  active ? 'scale-[1.04]' : 'group-hover:opacity-100'
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}