import clsx from 'clsx';

interface UserAvatarProps {
  url?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function UserAvatar({ url, size = 'md', className }: UserAvatarProps) {
  const dim = sizes[size];

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={clsx(dim, 'shrink-0 rounded-full object-cover', className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        dim,
        'shrink-0 rounded-full bg-offme-surface ring-1 ring-offme-border',
        className
      )}
    />
  );
}