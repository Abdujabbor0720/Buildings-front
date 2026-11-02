import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '@/shared/api/types';
import { cn } from '@/shared/utils/cn';
import { formatCount } from '@/shared/utils/money.utils';

interface PaginationProps {
  meta: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  className?: string;
}

const LIMITS = [20, 50, 100];

/** Juda ko‘p sahifa bo‘lsa o‘rtasi `…` bilan qisqartiriladi. */
function pageWindow(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

export function Pagination({ meta, onPageChange, onLimitChange, className }: PaginationProps) {
  if (!meta || meta.total === 0) return null;

  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 px-1 pt-4', className)}>
      <p className="t-meta">
        <span className="num text-ui">
          {formatCount(from)}–{formatCount(to)}
        </span>
        <span className="mx-1 text-faint">/</span>
        <span className="num text-ui text-muted">{formatCount(meta.total)}</span>
        <span className="ml-1">ta yozuv</span>
      </p>

      <div className="flex items-center gap-3">
        {onLimitChange ? (
          <label className="t-meta flex items-center gap-1.5">
            Sahifada
            <select
              value={meta.limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className="num h-7 rounded-md surface px-2 text-meta shadow-[0_0_0_1px_rgb(16_42_76/0.12)] focus:outline-none dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12)]"
            >
              {LIMITS.map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <nav className="flex items-center gap-1" aria-label="Sahifalash">
          <button
            type="button"
            onClick={() => onPageChange(meta.page - 1)}
            disabled={!meta.hasPrev}
            aria-label="Oldingi sahifa"
            className="grid size-7 place-items-center rounded-full text-muted transition-colors hover:bg-neutral-100 hover:text-strong disabled:opacity-35 disabled:hover:bg-transparent dark:hover:bg-white/8"
          >
            <ChevronLeft className="size-4" />
          </button>

          {pageWindow(meta.page, meta.totalPages).map((page, index) =>
            page === '…' ? (
              <span key={`gap-${index}`} className="text-faint px-1 text-meta">
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={page === meta.page ? 'page' : undefined}
                className={cn(
                  'num grid h-7 min-w-7 place-items-center rounded-md px-1.5 text-meta transition-colors',
                  page === meta.page
                    ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                    : 'text-muted hover:bg-neutral-100 hover:text-strong dark:hover:bg-white/8',
                )}
              >
                {page}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => onPageChange(meta.page + 1)}
            disabled={!meta.hasNext}
            aria-label="Keyingi sahifa"
            className="grid size-7 place-items-center rounded-full text-muted transition-colors hover:bg-neutral-100 hover:text-strong disabled:opacity-35 disabled:hover:bg-transparent dark:hover:bg-white/8"
          >
            <ChevronRight className="size-4" />
          </button>
        </nav>
      </div>
    </div>
  );
}
