import clsx from 'clsx';

export type XNavIconName =
  | 'home'
  | 'search'
  | 'notifications'
  | 'messages'
  | 'bookmarks'
  | 'profile'
  | 'more'
  | 'lists'
  | 'communities'
  | 'grok'
  | 'settings';

interface XNavIconProps {
  name: XNavIconName;
  active?: boolean;
  className?: string;
}

/**
 * Ícones modernos e consistentes para a navegação (iOS / Android / Web).
 * Estilo limpo baseado nos ícones oficiais atuais do X/Twitter (2024+).
 * - Inativo: traço fino (1.75)
 * - Ativo: traço mais grosso (2.25) ou preenchido (home, bookmarks, grok)
 */
export function XNavIcon({ name, active = false, className }: XNavIconProps) {
  const strokeW = active ? 2.25 : 1.75;
  const shared = clsx(
    'h-[26px] w-[26px] shrink-0 text-offme-text transition-all duration-200 ease-out',
    active ? 'opacity-100' : 'opacity-[0.78]',
    className
  );

  switch (name) {
    /* ----------------------------------------------------------------- HOME */
    case 'home':
      return active ? (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden>
          <path
            fill="currentColor"
            d="M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <path
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinejoin="round"
            strokeLinecap="round"
            d="M12 2.25 3.25 7.65v11.6a.5.5 0 0 0 .5.5H9.2v-6.75h5.6v6.75h5.45a.5.5 0 0 0 .5-.5V7.65L12 2.25z"
          />
        </svg>
      );

    /* --------------------------------------------------------------- SEARCH */
    case 'search':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <circle
            cx="10.5"
            cy="10.5"
            r="6.5"
            stroke="currentColor"
            strokeWidth={strokeW}
          />
          <path
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinecap="round"
            d="m15.5 15.5 4.25 4.25"
          />
        </svg>
      );

    /* -------------------------------------------------------- NOTIFICATIONS */
    case 'notifications':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <path
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinejoin="round"
            strokeLinecap="round"
            d="M12 2.75c-3.45 0-6.25 2.8-6.25 6.25v3.1l-1.5 2.6a.75.75 0 0 0 .65 1.125h14.2a.75.75 0 0 0 .65-1.125L18.25 12.1V9c0-3.45-2.8-6.25-6.25-6.25z"
          />
          <path
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinecap="round"
            d="M9.5 19a2.5 2.5 0 0 0 5 0"
          />
        </svg>
      );

    /* ------------------------------------------------------------- MESSAGES */
    case 'messages':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <path
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinejoin="round"
            strokeLinecap="round"
            d="M3 7.25A2.25 2.25 0 0 1 5.25 5h13.5A2.25 2.25 0 0 1 21 7.25v8.5A2.25 2.25 0 0 1 18.75 18H8.5l-3.85 3.02A.75.75 0 0 1 3.5 20.43V18h-.25A2.25 2.25 0 0 1 1 15.75v-8.5z"
          />
        </svg>
      );

    /* ------------------------------------------------------------ BOOKMARKS */
    case 'bookmarks':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden>
          <path
            fill={active ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinejoin="round"
            d="M4 4.5C4 3.12 5.12 2 6.5 2h11C18.88 2 20 3.12 20 4.5v17.15l-8-5.6-8 5.6V4.5z"
          />
        </svg>
      );

    /* -------------------------------------------------------------- PROFILE */
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <circle
            cx="12"
            cy="8"
            r="4"
            stroke="currentColor"
            strokeWidth={strokeW}
          />
          <path
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinecap="round"
            d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6"
          />
        </svg>
      );

    /* ---------------------------------------------------------------- MORE */
    case 'more':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden>
          <circle cx="5" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="19" cy="12" r="2" fill="currentColor" />
        </svg>
      );

    /* --------------------------------------------------------------- LISTS */
    case 'lists':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <path
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinecap="round"
            d="M9 6h11M9 12h11M9 18h11"
          />
          <circle cx="4" cy="6" r="1.5" fill="currentColor" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" />
          <circle cx="4" cy="18" r="1.5" fill="currentColor" />
        </svg>
      );

    /* --------------------------------------------------------- COMMUNITIES */
    case 'communities':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <circle
            cx="9"
            cy="8"
            r="3.25"
            stroke="currentColor"
            strokeWidth={strokeW}
          />
          <path
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinecap="round"
            d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
          />
          <circle
            cx="17"
            cy="9"
            r="2.5"
            stroke="currentColor"
            strokeWidth={strokeW}
          />
          <path
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinecap="round"
            d="M15 14.5c1-1 2-1.5 3.5-1.5 1.5 0 3 1 3.5 3"
          />
        </svg>
      );

    /* ---------------------------------------------------------------- GROK */
    case 'grok':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          {/* Big sparkle */}
          <path
            fill={active ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={active ? 0 : strokeW}
            strokeLinejoin="round"
            d="M12 2l1.8 5.2a4 4 0 0 0 2.4 2.4L21.4 11l-5.2 1.4a4 4 0 0 0-2.4 2.4L12 20l-1.8-5.2a4 4 0 0 0-2.4-2.4L2.6 11l5.2-1.4a4 4 0 0 0 2.4-2.4L12 2z"
          />
          {/* Small sparkle */}
          <path
            fill={active ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={active ? 0 : strokeW}
            strokeLinejoin="round"
            d="M19 13.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"
          />
        </svg>
      );

    /* ------------------------------------------------------------ SETTINGS */
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className={shared} aria-hidden fill="none">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.21.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
          />
        </svg>
      );
  }
}
