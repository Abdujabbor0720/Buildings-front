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

/**
 * Chiziq balandligi.
 *
 * ⚠️ 4px lik chiziq EKRANDA SOCH TOLASIGA aylanadi: rang to‘yinganligi
 * yo‘qoladi (yashil bilan qahrabo ajralmay qoladi), to‘ldirilgan qism
 * esa jadval qatorida ko‘zga tashlanmaydi. 6–10px — raqamni
 * ko‘lagalamaydigan, lekin rangi aniq o‘qiladigan oraliq.
 *
 * ⚠️ Balandlik matn qatoridan (16–18px) PAST bo‘lib qolishi kerak:
 * aks holda jadval qatorlari baland bo‘lib, bosh sahifa bir ekranga
 * sig‘masdi.
 */
const HEIGHTS = { xs: 'h-1.5', sm: 'h-2', md: 'h-2.5' } as const;
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
            className="absolute top-0 h-full w-0.5 rounded-full bg-neutral-900/60 dark:bg-white/70"
            style={{ left: `${clampedTarget}%` }}
            title={`Reja bo‘yicha: ${clampedTarget.toFixed(0)}%`}
          />
        ) : null}
      </div>

      {/* ⚠️ Foiz matnining O‘LCHAMI BERILMAGAN — u atrofdagi matndan
          meros oladi. Qat‘iy `text-meta` bo‘lganda bosh sahifadagi
          11px li jadvalda foiz qolgan ustunlardan kattaroq bo‘lib,
          katakdan «o‘sib chiqqan» kabi ko‘rinardi. */}
      {showValue ? (
        <span className="num w-8 shrink-0 text-right">{Math.round(clamped)}%</span>
      ) : null}
    </div>
  );
}
