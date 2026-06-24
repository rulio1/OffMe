import React from 'react';
import { skeleton, classNames } from '@/styles/design-system';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rectangle';
  width?: string | number;
  height?: string | number;
  className?: string;
  children?: never;
}

export function Skeleton({
  variant = 'rectangle',
  width = '100%',
  height = '20px',
  className,
}: SkeletonProps) {
  const baseClasses = classNames(
    skeleton.base,
    variant === 'circle' && skeleton.circle,
    variant === 'rectangle' && skeleton.rectangle,
    className
  );

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return <div className={baseClasses} style={style} aria-live="polite" aria-busy="true" />;
}

interface SkeletonTextProps {
  lines?: number;
  width?: string | number;
  className?: string;
}

export function SkeletonText({ lines = 3, width = '100%', className }: SkeletonTextProps) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? '80%' : width}
          height="16px"
          className={index < lines - 1 ? 'mb-2' : ''}
        />
      ))}
    </div>
  );
}