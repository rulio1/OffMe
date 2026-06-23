import { ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

interface OfficialBadgeProps {
  className?: string;
  /** Tooltip/aria-label text. */
  label?: string;
  /** When true, renders a pill with icon + text instead of just the icon. */
  withText?: boolean;
}

/**
 * Distinct seal used for official OffMe accounts (OffMe, Beta Team, Support...).
 *
 * Visually different from the regular `VerifiedBadge` to make official status
 * unmistakable. Uses a shield/check glyph filled with the brand accent.
 */
export function OfficialBadge({
  className,
  label = 'Conta oficial',
  withText = false,
}: OfficialBadgeProps) {
  if (withText) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 rounded-full bg-offme-accent px-2 py-0.5 text-xs font-semibold text-offme-bg',
          className
        )}
        title={label}
      >
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        Oficial
      </span>
    );
  }

  return (
    <ShieldCheck
      className={clsx(
        'h-[18px] w-[18px] shrink-0 fill-offme-accent text-offme-bg',
        className
      )}
      aria-label={label}
    />
  );
}