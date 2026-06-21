import clsx from 'clsx';

export type XNavIconName =
  | 'home'
  | 'search'
  | 'grok'
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

/** Ícones da navbar no estilo X (traço fino, casa preenchida quando ativa). */
export function XNavIcon({ name, active = false, className }: XNavIconProps) {
  const shared = clsx(
    'h-[26px] w-[26px] shrink-0 text-offme-text transition-all duration-200 ease-out',
    active ? 'opacity-100' : 'opacity-[0.78]',
    className
  );

  switch (name) {
    case 'home':
      return active ? (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden>
          <path
            fill="currentColor"
            d="M21.591 7.146L12 1.88 2.409 7.146v12.879h6.481V13.5h5.826v6.525h6.481V7.146z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <path
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinejoin="round"
            d="M12 2.25 3.75 7.5v12.75h5.25v-6.75h6v6.75h5.25V7.5L12 2.25z"
          />
        </svg>
      );

    case 'search':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <path
            stroke="currentColor"
            strokeWidth={active ? 2.1 : 1.75}
            strokeLinecap="round"
            d="M10.25 3.75a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm0 0L16.25 16.25"
          />
        </svg>
      );

    case 'grok':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <path
            stroke="currentColor"
            strokeWidth={active ? 2.1 : 1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3.5v3.25M12 17.25V20.5M4.75 12H8M16 12h3.25M6.4 6.4l2.3 2.3M15.3 15.3l2.3 2.3M17.6 6.4l-2.3 2.3M8.7 15.3l-2.3 2.3"
          />
          <circle cx="12" cy="12" r="2.35" fill="currentColor" stroke="none" />
        </svg>
      );

    case 'notifications':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <path
            stroke="currentColor"
            strokeWidth={active ? 2.1 : 1.75}
            strokeLinejoin="round"
            d="M12 3.25c-3.17 0-5.75 2.58-5.75 5.75v4.1l-1.4 2.1h14.3l-1.4-2.1v-4.1c0-3.17-2.58-5.75-5.75-5.75z"
          />
          <path
            stroke="currentColor"
            strokeWidth={active ? 2.1 : 1.75}
            strokeLinecap="round"
            d="M9.25 18.5a2.75 2.75 0 0 0 5.5 0"
          />
        </svg>
      );

    case 'messages':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <path
            stroke="currentColor"
            strokeWidth={active ? 2.1 : 1.75}
            strokeLinejoin="round"
            d="M4.5 5.75h15a1.25 1.25 0 0 1 1.25 1.25v8.5A1.25 1.25 0 0 1 19.5 16.75H9.2L5.25 19.5v-2.75H4.5a1.25 1.25 0 0 1-1.25-1.25v-8.5A1.25 1.25 0 0 1 4.5 5.75z"
          />
        </svg>
      );

    case 'bookmarks':
      return active ? (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden>
          <path
            fill="currentColor"
            d="M4 4.5C4 3.67 4.67 3 5.5 3h13c.83 0 1.5.67 1.5 1.5V22l-8-4.5L4 22V4.5z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <path
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinejoin="round"
            d="M4 4.5C4 3.67 4.67 3 5.5 3h13c.83 0 1.5.67 1.5 1.5V22l-8-4.5L4 22V4.5z"
          />
        </svg>
      );

    case 'profile':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <path
            stroke="currentColor"
            strokeWidth={active ? 2.1 : 1.75}
            strokeLinecap="round"
            d="M5.5 20.5c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6"
          />
          <circle
            cx="12"
            cy="8.75"
            r="4.25"
            stroke="currentColor"
            strokeWidth={active ? 2.1 : 1.75}
          />
        </svg>
      );

    case 'more':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <circle cx="5.5" cy="12" r="1.75" fill="currentColor" />
          <circle cx="12" cy="12" r="1.75" fill="currentColor" />
          <circle cx="18.5" cy="12" r="1.75" fill="currentColor" />
        </svg>
      );
  }
}