import Image from 'next/image';
import clsx from 'clsx';

interface UserAvatarProps {
  url?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { className: 'h-8 w-8', px: 32 },
  md: { className: 'h-10 w-10', px: 40 },
  lg: { className: 'h-12 w-12', px: 48 },
};

export function UserAvatar({ url, size = 'md', className }: UserAvatarProps) {
  const dim = sizes[size];

  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={dim.px}
        height={dim.px}
        className={clsx(dim.className, 'shrink-0 rounded-full object-cover', className)}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={clsx(
        dim.className,
        'shrink-0 rounded-full bg-offme-surface ring-1 ring-offme-border',
        className
      )}
    />
  );
}