import { cn } from '@/shared/utils/cn';

interface SparkBarsProps {
  values: number[];
  /** Ustunlarning ko‘rsatma matni (hover). */
  labels?: string[];
  className?: string;
  barClassName?: string;
  /** Oxirgi ustunni ajratib ko‘rsatish (joriy oy). */
  highlightLast?: boolean;
  /**
   * Ajratilgan ustunning rangi.
   *
   * ⚠️ Sukut bo‘yicha deyarli qora. Bu NEYTRAL kartada to‘g‘ri, lekin
   * rangli tusli kartada («Joriy yil yakunlanadi» — binafsha) qora
   * ustun tusni kesib, diagrammani kartadan ajratib yuboradi.
   * Shuning uchun rang chaqiruv joyida beriladi.
   */
  highlightClassName?: string;
}

/**
 * KPI kartasidagi mikro-diagramma.
 *
 * ⚠️ Ataylab kutubxonasiz: Recharts bu o‘lchamda ortiqcha DOM va
 * qayta chizish beradi, 6 ta kartada esa bu sezilarli sekinlashuv.
 * Bu yerda bor-yo‘g‘i `div` lar balandligi.
 */
export function SparkBars({
  values,
  labels,
  className,
  barClassName,
  highlightLast,
  highlightClassName,
}: SparkBarsProps) {
  const max = Math.max(1, ...values);

  /*
   * ⚠️ ZICH REJIM — ustun SONIGA qarab.
   *
   * Har ustunning eng kichik kengligi 3px va oraliq 3px bo'lganda
   * O'N IKKI oylik diagramma 69px joy talab qiladi. Idish esa
   * ko'rsatkich kartasida 36px (`w-9`): qolgan ~25px kartadan
   * TASHQARIGA chiqib, yonidagi kartaning ustida chizilardi —
   * ekranda u «sinib qolgan chiziq» bo'lib ko'rinardi.
   *
   * Sakkizdan ko'p ustunda oraliq 1px, eng kichik kenglik 2px:
   * 12 × 2 + 11 × 1 = 35px, ya'ni idishga sig'adi. Yillik
   * diagramma (3–4 ustun) esa avvalgidek keng qoladi.
   */
  const dense = values.length > 8;

  return (
    /* Asos chizig‘i (`border-b`) MAJBURIY: oy-oy taqsimotda qiymatlar
       ko‘pincha nolga teng bo‘ladi va chiziqsiz ular ekranda «uzuq-yuluq
       nuqtalar» bo‘lib ko‘rinadi — diagramma buzilganga o‘xshaydi.
       Chiziq bilan esa nol qiymat aniq «nol» deb o‘qiladi. */
    <div
      className={cn(
        'flex h-7 items-end border-b border-subtle pb-px',
        dense ? 'gap-px' : 'gap-[3px]',
        className,
      )}
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
              'w-full rounded-t-[2px] transition-all duration-300',
              dense ? 'min-w-[2px]' : 'min-w-[3px]',
              isLast
                ? (highlightClassName ?? 'bg-neutral-900 dark:bg-neutral-100')
                : (barClassName ?? 'bg-neutral-300 dark:bg-white/25'),
            )}
          />
        );
      })}
    </div>
  );
}
