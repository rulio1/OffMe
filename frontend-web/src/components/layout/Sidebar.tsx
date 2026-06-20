'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  MoreHorizontal,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';
import { OffMeLogo } from '@/components/auth/OffMeLogo';
import { getStoredUser, clearSession } from '@/lib/auth';
import { logout } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Search },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/messages', label: 'Messages', icon: Mail },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/profile', label: 'Profile', icon: User },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();

  const handleLogout = async () => {
    await logout();
    clearSession();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-[275px] flex-col px-3 xl:flex">
      <Link href="/" className="mb-2 mt-3 inline-flex rounded-full px-3 py-2 transition-colors hover:bg-white/10">
        <OffMeLogo size="sm" />
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'group flex items-center gap-5 rounded-full px-4 py-3 text-xl transition-colors hover:bg-white/10',
              pathname === href && 'font-bold'
            )}
          >
            <Icon
              className={clsx('h-7 w-7', pathname === href ? 'stroke-[2.5]' : 'stroke-2')}
            />
            <span className="hidden xl:inline">{label}</span>
          </Link>
        ))}
        <button className="group flex items-center gap-5 rounded-full px-4 py-3 text-xl transition-colors hover:bg-white/10">
          <MoreHorizontal className="h-7 w-7 stroke-2" />
          <span className="hidden xl:inline">More</span>
        </button>
      </nav>

      <button className="pulse-btn-primary mt-4 hidden w-[90%] py-3 text-lg xl:block">
        Post
      </button>

      <div className="mt-auto mb-4 flex items-center gap-3 rounded-full p-3 transition-colors hover:bg-white/10">
        <div className="h-10 w-10 shrink-0 rounded-full bg-pulse-surface" />
        <div className="hidden min-w-0 flex-1 xl:block">
          <p className="truncate text-sm font-bold">{user?.displayName ?? 'Usuário'}</p>
          <p className="truncate text-sm text-pulse-muted">@{user?.username ?? 'usuario'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="hidden rounded-full p-1.5 text-pulse-muted transition-colors hover:bg-red-500/10 hover:text-red-400 xl:block"
          aria-label="Sair"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}