import { BadgeCheck } from 'lucide-react';
import clsx from 'clsx';

interface VerifiedBadgeProps {
  className?: string;
  label?: string;
}

export function VerifiedBadge({
  className,
  label = 'Verificado',
}: VerifiedBadgeProps) {
  return (
    <BadgeCheck
      className={clsx(
        'h-[18px] w-[18px] shrink-0 fill-offme-accent text-offme-bg',
        className
      )}
      aria-label={label}
    />
  );
}