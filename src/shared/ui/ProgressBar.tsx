import { cn } from '@/shared/utils/cn';
import { progressTone } from '@/shared/constants/health';

interface ProgressBarProps {
  value: number;
  /** Foiz matni o‘ng tomonda ko‘rsatilsinmi. */
  showValue?: boolean;
  /** Rangni majburan belgilash (holat rangi bilan moslash uchun). */
  tone?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  /** Rejadagi qiymat — ustiga nozik chiziq chiziladi. */
  target?: number | null;
}

const HEIGHTS = { xs: 'h-1', sm: 'h-1.5', md: 'h-2' } as const;

/**
 * ⚠️ Chiziq INGICHKA. Qalin progress bar e’tiborni raqamdan tortib oladi,
 * holbuki foiz raqami aniqroq ma’lumot — chiziq faqat «ko‘z bilan
 * taqqoslash» uchun.
 */
export function ProgressBar({ value, showValue = false, tone, size = 'sm', className, target }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const clampedTarget = target === null || target === undefined ? null : Math.max(0, Math.min(100, target));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('relative w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-white/12', HEIGHTS[size])}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 ease-out', tone ?? progressTone(clamped))}
          style={{ width: `${clamped}%` }}
        />
        {/* Reja chizig‘i: «qayerda bo‘lishi kerak edi» — eng muhim
            taqqoslash, uni alohida ustun qilib ko‘rsatish joy egallardi. */}
        {clampedTarget !== null && Math.abs(clampedTarget - clamped) > 1 ? (
          <span
            className="absolute top-0 h-full w-px bg-neutral-900/55 dark:bg-white/60"
            style={{ left: `${clampedTarget}%` }}
            title={`Reja bo‘yicha: ${clampedTarget.toFixed(0)}%`}
          />
        ) : null}
      </div>

      {showValue ? (
        <span className="num w-9 shrink-0 text-right text-meta">{Math.round(clamped)}%</span>
      ) : null}
    </div>
  );
}
