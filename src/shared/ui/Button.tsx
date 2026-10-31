import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

/**
 * Tugma shakli — KAPSULA (`rounded-full`), asosiysi QORA.
 *
 * Brend sarig‘i asosiy tugmaga BERILMAYDI: ekranda o‘nlab tugma bo‘ladi,
 * hammasi sariq bo‘lsa urg‘u o‘z ma’nosini yo‘qotadi. Sariq faqat
 * `accent` da — sahifada ko‘pi bilan bitta.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-neutral-950 text-white shadow-[0_1px_2px_rgb(10_10_10/0.18)] hover:bg-neutral-800 active:bg-neutral-900 ' +
    'disabled:bg-neutral-300 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200',
  accent:
    'bg-brand-500 text-white shadow-[0_1px_2px_rgb(179_89_0/0.25)] hover:bg-brand-600 active:bg-brand-700 ' +
    'disabled:bg-brand-200',
  secondary:
    'surface text-strong shadow-[0_0_0_1px_rgb(16_20_15/0.1)] hover:bg-neutral-50 ' +
    'dark:shadow-[0_0_0_1px_rgb(255_255_255/0.14)] dark:hover:bg-white/8',
  outline:
    'bg-transparent text-strong shadow-[0_0_0_1px_rgb(16_20_15/0.14)] hover:bg-neutral-100/70 ' +
    'dark:shadow-[0_0_0_1px_rgb(255_255_255/0.16)] dark:hover:bg-white/8',
  ghost: 'bg-transparent text-muted hover:bg-neutral-100 hover:text-strong dark:hover:bg-white/8',
  danger:
    'bg-danger-500 text-white shadow-[0_1px_2px_rgb(180_35_24/0.25)] hover:bg-danger-600 active:bg-danger-700 ' +
    'disabled:bg-danger-200',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3.5 text-meta',
  md: 'h-9 gap-2 px-4 text-ui',
  lg: 'h-11 gap-2 px-6 text-body',
  icon: 'size-9 justify-center',
  'icon-sm': 'size-8 justify-center',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, leftIcon, rightIcon, className, children, disabled, ...rest },
  ref,
) {
  const solid = variant === 'primary' || variant === 'accent' || variant === 'danger';
  const iconOnly = size === 'icon' || size === 'icon-sm';

  return (
    <button
      ref={ref}
      // ⚠️ Yuklanayotgan tugma ham o‘chiriladi: ikki marta bosish ikkita
      // bir xil so‘rov yuborishning eng keng tarqalgan sababi.
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full font-medium whitespace-nowrap',
        'transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
        // ⚠️ Serif KURSIV — faqat to‘ldirilgan tugmada va faqat matnli
        // o‘lchamda. Belgi-tugmada matn yo‘q, kichikda esa kursiv serif
        // 12px da o‘qilishi qiyinlashadi.
        solid && !iconOnly && size !== 'sm' && 'font-figure text-[1.07em] font-normal italic',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
