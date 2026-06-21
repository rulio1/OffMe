import clsx from 'clsx';
import {
  Bell,
  Bookmark,
  Ellipsis,
  Home,
  Mail,
  Search,
  User,
} from 'lucide-react';

export type XNavIconName =
  | 'home'
  | 'search'
  | 'notifications'
  | 'messages'
  | 'bookmarks'
  | 'profile'
  | 'more';

interface XNavIconProps {
  name: XNavIconName;
  active?: boolean;
  className?: string;
}

const baseClass =
  'h-[26px] w-[26px] shrink-0 text-offme-text transition-all duration-200 ease-out';

/** Ícones de navegação — Lucide (SVG inline). */
export function XNavIcon({ name, active = false, className }: XNavIconProps) {
  const shared = clsx(baseClass, active ? 'opacity-100' : 'opacity-[0.78]', className);
  const stroke = active ? 2.25 : 1.75;

  switch (name) {
    case 'home':
      return (
        <Home
          className={shared}
          strokeWidth={active ? 0 : stroke}
          fill={active ? 'currentColor' : 'none'}
          aria-hidden
        />
      );

    case 'search':
      return <Search className={shared} strokeWidth={stroke} aria-hidden />;

    case 'notifications':
      return (
        <Bell
          className={shared}
          strokeWidth={stroke}
          fill={active ? 'currentColor' : 'none'}
          aria-hidden
        />
      );

    case 'messages':
      return <Mail className={shared} strokeWidth={stroke} aria-hidden />;

    case 'bookmarks':
      return (
        <Bookmark
          className={shared}
          strokeWidth={active ? 0 : stroke}
          fill={active ? 'currentColor' : 'none'}
          aria-hidden
        />
      );

    case 'profile':
      return <User className={shared} strokeWidth={stroke} aria-hidden />;

    case 'more':
      return <Ellipsis className={shared} strokeWidth={stroke} aria-hidden />;
  }
}