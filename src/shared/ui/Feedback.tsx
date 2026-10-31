import type { ReactNode } from 'react';
import { Loader2, SearchX, TriangleAlert } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from './Button';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-brand-500', className)} aria-hidden />;
}

export function LoadingBlock({ label = 'Yuklanmoqda…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-14', className)} role="status">
      <Spinner className="size-6" />
      <p className="t-meta">{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} aria-hidden />;
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title = 'Ma’lumot topilmadi', description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}>
      <div className="text-faint surface-inset grid size-11 place-items-center rounded-full">
        {icon ?? <SearchX className="size-5" />}
      </div>
      <div>
        <p className="text-ui font-medium text-strong">{title}</p>
        {description ? <p className="t-meta mx-auto mt-1 max-w-sm">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}
      role="alert"
    >
      <div className="grid size-11 place-items-center rounded-full bg-danger-50 text-danger-600 dark:bg-danger-500/12 dark:text-danger-300">
        <TriangleAlert className="size-5" />
      </div>
      <div>
        <p className="text-ui font-medium text-strong">Ma’lumotni yuklab bo‘lmadi</p>
        <p className="t-meta mx-auto mt-1 max-w-sm">{message ?? 'Keyinroq qayta urinib ko‘ring.'}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Qayta urinish
        </Button>
      ) : null}
    </div>
  );
}
