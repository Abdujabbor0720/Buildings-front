import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

interface BadgeProps {
  children: ReactNode;
  className?: string;
  /** Chap tomonda rangli nuqta. */
  dot?: string;
  size?: 'sm' | 'md';
}

export function Badge({ children, className, dot, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-micro' : 'px-2.5 py-1 text-meta',
        className,
      )}
    >
      {dot ? <span className={cn('size-1.5 shrink-0 rounded-full', dot)} aria-hidden /> : null}
      {children}
    </span>
  );
}
