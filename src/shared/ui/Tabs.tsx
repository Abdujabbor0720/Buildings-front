import { cn } from '@/shared/utils/cn';

export interface TabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  options: ReadonlyArray<TabOption<T>>;
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  /** `pill` — karta ichidagi filtr; `underline` — sahifa darajasidagi bo‘lim. */
  variant?: 'pill' | 'underline';
  /**
   * Butun kenglikka cho‘ziladi, segmentlar TENG bo‘linadi.
   *
   * ⚠️ Tor kartada MAJBURIY: `inline-flex` da segmentlar o‘z matniga
   * qarab kengayadi va «Barchasi / Reja asosida / Kechikayotgan /
   * Xavfli» 330px li kartaga sig‘masdan, oxirgisi qirqilib qolardi.
   */
  fill?: boolean;
  className?: string;
}

/**
 * Segmentli tab — maketdagi «Barchasi / Reja asosida / …» boshqaruvi.
 * Tablist semantikasi bilan: klaviatura bilan boshqarish mumkin.
 */
export function Tabs<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
  variant = 'pill',
  fill,
  className,
}: TabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div role="tablist" className={cn('flex items-center gap-1 border-b border-subtle', className)}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.value)}
              className={cn(
                'relative -mb-px border-b-2 px-3 pb-2.5 text-ui font-medium whitespace-nowrap transition-colors',
                active
                  ? 'border-brand-500 text-strong'
                  : 'border-transparent text-muted hover:border-neutral-300 hover:text-strong',
              )}
            >
              {option.label}
              {option.count !== undefined ? (
                <span className={cn('num ml-1.5 text-meta', active ? 'text-brand-700 dark:text-brand-400' : 'text-faint')}>
                  {option.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  /*
   * ⚠️ Segmentlar ALOHIDA tugmalar — umumiy «yo‘lak» (`surface-inset`
   * konteyner) ICHIDA emas. Maketda ham shunday: tugmalar orasida
   * bo‘shliq bor va har biri o‘z kartochkasida turadi. Umumiy
   * yo‘lakda ular bir-biriga yopishib, «bitta uzun maydon» bo‘lib
   * ko‘rinardi.
   *
   * ⚠️ FAOL segment TO‘Q KO‘K (brend rangi) + oq matn. Ilgari u oq
   * fon va soya bilan ajratilardi: oq karta ustida oq segment
   * deyarli bilinmas, qaysi tab tanlanganini faqat soya aytardi.
   */
  return (
    <div
      role="tablist"
      /*
       * ⚠️ `fill` da `w-full` YO'Q va qaytarilmaydi. `div` baribir
       * blok element: `display:flex` unga mavjud kenglikni to'liq
       * beradi. `w-full` esa kenglikni OTA elementdan oladi va yon
       * chetni (`mx-3` — tumanlar jadvalidagi tablar) HISOBGA
       * OLMAYDI: natijada blok 24px keng bo'lib, har ikki tomondan
       * 12px dan kartadan tashqariga chiqib ketardi.
       */
      className={cn('items-center gap-1.5', fill ? 'flex' : 'inline-flex', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-lg font-medium whitespace-nowrap transition-colors duration-150',
              size === 'sm' ? 'px-3 py-1 text-meta' : 'px-4 py-1.5 text-ui',
              fill && 'min-w-0 flex-1 truncate px-1 text-nano',
              active
                ? // Diagonal o'tish + o'z rangidagi soya: yassi ko'k
                  // to'rtburchak oq karta ustida «yopishtirilgan» bo'lib
                  // ko'rinardi, soya esa uni yuzadan ko'taradi.
                  'bg-linear-to-b from-brand-400 to-brand-600 text-white shadow-[var(--shadow-brand)]'
                : 'surface-inset text-muted hover:bg-neutral-200/80 hover:text-strong dark:hover:bg-white/10',
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  'num ml-1.5 text-meta',
                  active ? 'text-white/80' : 'text-faint',
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
