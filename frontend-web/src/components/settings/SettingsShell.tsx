'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

const NAV = [
  { href: '/settings', label: 'Geral', exact: true },
  { href: '/settings/privacy', label: 'Privacidade' },
  { href: '/settings/notifications', label: 'Notificações' },
  { href: '/settings/scheduled', label: 'Agendados' },
  { href: '/settings/appearance', label: 'Aparência' },
  { href: '/settings/account', label: 'Conta' },
  { href: '/settings/verification', label: 'Verificação' },
];

export function SettingsShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-offme-border bg-offme-bg/90 backdrop-blur-xl">
        <div className="flex h-[53px] items-center gap-6 px-4">
          <Link
            href="/"
            className="rounded-full p-2 transition-colors hover:bg-offme-hover"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {description && <p className="text-[13px] text-offme-muted">{description}</p>}
          </div>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-offme-border px-4 py-2">
        {NAV.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
                active
                  ? 'bg-offme-accent/10 text-offme-accent'
                  : 'text-offme-muted hover:bg-offme-hover hover:text-offme-text'
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-6">{children}</div>
    </div>
  );
}