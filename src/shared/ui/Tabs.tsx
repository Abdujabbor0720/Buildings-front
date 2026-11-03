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

  return (
    <div
      role="tablist"
      className={cn(
        'items-center gap-0.5 rounded-lg surface-inset p-0.5',
        fill ? 'flex w-full' : 'inline-flex',
        className,
      )}
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
              'rounded-md font-medium whitespace-nowrap transition-all duration-150',
              size === 'sm' ? 'px-3 py-1 text-meta' : 'px-4 py-1.5 text-ui',
              fill && 'min-w-0 flex-1 truncate px-0.5 text-nano',
              active
                ? 'surface text-strong shadow-[0_0_0_1px_rgb(16_42_76/0.08),0_1px_2px_rgb(16_42_76/0.06)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12)]'
                : 'text-muted hover:text-strong',
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
