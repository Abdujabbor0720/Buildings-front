import { cn } from '@/shared/utils/cn';

interface SparkBarsProps {
  values: number[];
  /** Ustunlarning ko‘rsatma matni (hover). */
  labels?: string[];
  className?: string;
  barClassName?: string;
  /** Oxirgi ustunni ajratib ko‘rsatish (joriy oy). */
  highlightLast?: boolean;
}

/**
 * KPI kartasidagi mikro-diagramma.
 *
 * ⚠️ Ataylab kutubxonasiz: Recharts bu o‘lchamda ortiqcha DOM va
 * qayta chizish beradi, 6 ta kartada esa bu sezilarli sekinlashuv.
 * Bu yerda bor-yo‘g‘i `div` lar balandligi.
 */
export function SparkBars({ values, labels, className, barClassName, highlightLast }: SparkBarsProps) {
  const max = Math.max(1, ...values);

  return (
    /* Asos chizig‘i (`border-b`) MAJBURIY: oy-oy taqsimotda qiymatlar
       ko‘pincha nolga teng bo‘ladi va chiziqsiz ular ekranda «uzuq-yuluq
       nuqtalar» bo‘lib ko‘rinadi — diagramma buzilganga o‘xshaydi.
       Chiziq bilan esa nol qiymat aniq «nol» deb o‘qiladi. */
    <div
      className={cn('flex h-7 items-end gap-[3px] border-b border-subtle pb-px', className)}
      aria-hidden
    >
      {values.map((value, index) => {
        const heightPercent = value === 0 ? 0 : Math.max(12, (value / max) * 100);
        const isLast = highlightLast && index === values.length - 1;
        return (
          <span
            key={index}
            title={labels?.[index] ? `${labels[index]}: ${value}` : String(value)}
            style={{ height: `${heightPercent}%` }}
            className={cn(
              'w-full min-w-[3px] rounded-t-[2px] transition-all duration-300',
              isLast ? 'bg-neutral-900 dark:bg-neutral-100' : (barClassName ?? 'bg-neutral-300 dark:bg-white/25'),
            )}
          />
        );
      })}
    </div>
  );
}
