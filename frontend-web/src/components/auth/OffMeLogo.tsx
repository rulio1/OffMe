import Image from 'next/image';
import clsx from 'clsx';

interface OffMeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const dimensions = {
  sm: { px: 28, className: 'h-7 w-7' },
  md: { px: 40, className: 'h-10 w-10' },
  lg: { px: 48, className: 'h-12 w-12' },
  xl: { px: 140, className: 'h-[min(140px,18vw)] w-[min(140px,18vw)]' },
};

export function OffMeLogo({ size = 'md', className }: OffMeLogoProps) {
  const { px, className: sizeClass } = dimensions[size];

  return (
    <Image
      src="/logo.png"
      alt="OffMe"
      width={px}
      height={px}
      priority={size === 'xl'}
      className={clsx('object-contain', sizeClass, className)}
    />
  );
}