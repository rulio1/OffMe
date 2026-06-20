import clsx from 'clsx';

interface OffMeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl',
};

export function OffMeLogo({ size = 'md', className }: OffMeLogoProps) {
  return (
    <div className={clsx('font-extrabold tracking-tight', sizes[size], className)}>
      <span className="text-pulse-text">Off</span>
      <span className="text-pulse-accent">Me</span>
    </div>
  );
}