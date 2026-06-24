import Image from 'next/image';
import clsx from 'clsx';
import { OffMeLogo } from '@/components/auth/OffMeLogo';
import { avatars, classNames } from '@/styles/design-system';

interface UserAvatarProps {
  url?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  isOnline?: boolean;
}

export function UserAvatar({ url, size = 'md', className, isOnline = false }: UserAvatarProps) {
  const sizeClasses = avatars.size[size] || avatars.size.md;
  const baseClasses = classNames(
    sizeClasses,
    avatars.base,
    className
  );

  const getContainerClasses = () => {
    const containerClasses = classNames(
      sizeClasses,
      'shrink-0 rounded-full bg-offme-surface flex items-center justify-center',
      isOnline ? avatars.online : avatars.ring,
      className
    );
    return containerClasses;
  };

  if (url?.startsWith('/brand/')) {
    return (
      <div className={getContainerClasses()}>
        <OffMeLogo className="w-full h-full p-1" />
      </div>
    );
  }

  if (url) {
    // Calculate size in pixels based on the size prop
    const sizeMap: Record<string, number> = {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 48,
      xl: 64,
      xxl: 80,
    };
    const pxSize = sizeMap[size] || 40;

    return (
      <div className={classNames(isOnline ? avatars.online : avatars.ring, 'shrink-0')}>
        <Image
          src={url}
          alt=""
          width={pxSize}
          height={pxSize}
          className={classNames(sizeClasses, avatars.base, className)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={getContainerClasses()} />
  );
}
